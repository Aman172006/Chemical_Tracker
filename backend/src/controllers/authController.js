const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { db, admin } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");
require("dotenv").config();

// ============================================
// HELPER: Generate JWT Token
// ============================================
const generateToken = (userId, email, role) => {
  return jwt.sign(
    {
      userId: userId,
      email: email,
      role: role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// ============================================
// REGISTER NEW USER
// POST /api/auth/register
// ============================================
const register = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // --- VALIDATION ---
    if (!email || !password || !name || !phone) {
      return res.status(400).json({
        status: "error",
        message: "All fields required: email, password, name, phone",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }

    // Validate role
    const validRoles = [
      CONSTANTS.ROLES.OWNER,
      CONSTANTS.ROLES.RECEIVER,
      CONSTANTS.ROLES.ADMIN,
    ];
    const userRole = role && validRoles.includes(role) ? role : CONSTANTS.ROLES.RECEIVER;

    // --- CHECK IF EMAIL ALREADY EXISTS ---
    const existingUser = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .where("email", "==", email.toLowerCase().trim())
      .get();

    if (!existingUser.empty) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // --- HASH PASSWORD ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- CREATE USER DOCUMENT ---
    const userId = uuidv4();

    const userData = {
      userId: userId,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone.trim(),
      role: userRole,
      containers: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save to Firestore
    await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(userId)
      .set(userData);

    // --- GENERATE TOKEN ---
    const token = generateToken(userId, userData.email, userData.role);

    // --- RESPONSE (don't send password back) ---
    const { password: _, ...userWithoutPassword } = userData;

    logger.success(`New user registered: ${email} as ${userRole}`);

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: userWithoutPassword,
        token: token,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// LOGIN USER
// POST /api/auth/login
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- VALIDATION ---
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // --- FIND USER BY EMAIL ---
    const userSnapshot = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // --- VERIFY PASSWORD ---
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // --- GENERATE TOKEN ---
    const token = generateToken(userData.userId, userData.email, userData.role);

    // --- UPDATE LAST LOGIN ---
    await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(userData.userId)
      .update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // --- RESPONSE ---
    const { password: _, ...userWithoutPassword } = userData;

    logger.success(`User logged in: ${email}`);

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token: token,
      },
    });
  } catch (error) {
    logger.error("Login error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// GET CURRENT USER PROFILE
// GET /api/auth/me
// Requires: verifyToken middleware
// ============================================
const getProfile = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const userDoc = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(req.user.userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const userData = userDoc.data();
    const { password: _, ...userWithoutPassword } = userData;

    return res.status(200).json({
      status: "success",
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch profile",
    });
  }
};

// ============================================
// UPDATE USER PROFILE
// PUT /api/auth/profile
// Requires: verifyToken middleware
// ============================================
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Nothing to update. Send name or phone.",
      });
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(req.user.userId)
      .update(updateData);

    logger.success(`Profile updated for: ${req.user.email}`);

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: updateData,
    });
  } catch (error) {
    logger.error("Update profile error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to update profile",
    });
  }
};

// ============================================
// GET ALL USERS (ADMIN ONLY)
// GET /api/auth/users
// ============================================
const getAllUsers = async (req, res) => {
  try {
    const usersSnapshot = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .orderBy("createdAt", "desc")
      .get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const { password: _, ...userWithoutPassword } = userData;
      users.push(userWithoutPassword);
    });

    return res.status(200).json({
      status: "success",
      data: {
        count: users.length,
        users: users,
      },
    });
  } catch (error) {
    logger.error("Get all users error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
};
const { db, admin } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");

// ============================================
// SYNC / CREATE USER PROFILE
// POST /api/auth/register
// Called after Firebase Auth sign-up on frontend
// Body: { name, phone, role }
// Header: Authorization: Bearer <Firebase ID Token>
// ============================================
const register = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Firebase ID token required.",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const firebaseEmail = decodedToken.email || null;
    const firebasePhone = decodedToken.phone_number || null;

    const { name, phone, role } = req.body;

    // Validate
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        status: "error",
        message: "Name is required (min 2 characters).",
      });
    }

    const userRole = [CONSTANTS.ROLES.OWNER, CONSTANTS.ROLES.RECEIVER].includes(role)
      ? role
      : CONSTANTS.ROLES.OWNER;

    // Check if user already exists
    const existingDoc = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(uid)
      .get();

    if (existingDoc.exists) {
      // User already registered — return existing profile
      const userData = existingDoc.data();
      return res.status(200).json({
        status: "success",
        message: "User already registered",
        data: {
          user: {
            userId: uid,
            ...userData,
          },
        },
      });
    }

    // Create user profile in Firestore
    const userData = {
      userId: uid,
      email: firebaseEmail,
      phone: phone || firebasePhone || null,
      name: name.trim(),
      role: userRole,
      authProvider: firebaseEmail ? "email" : "phone",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).set(userData);

    // Set custom claims for role-based access
    await admin.auth().setCustomUserClaims(uid, { role: userRole });

    logger.success(`User registered: ${firebaseEmail || firebasePhone} (${userRole})`);

    return res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: {
        user: {
          userId: uid,
          email: firebaseEmail,
          phone: phone || firebasePhone,
          name: name.trim(),
          role: userRole,
        },
      },
    });
  } catch (error) {
    logger.error("Register error:", error.message);

    if (error.code === "auth/id-token-expired" || error.code === "auth/argument-error") {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// SYNC LOGIN (Update lastLogin timestamp)
// POST /api/auth/login
// Called after Firebase Auth sign-in on frontend
// Header: Authorization: Bearer <Firebase ID Token>
// ============================================
const login = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Firebase ID token required.",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user profile
    const userDoc = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "User profile not found. Please register first.",
      });
    }

    const userData = userDoc.data();

    // Update last login
    await db.collection(CONSTANTS.COLLECTIONS.USERS).doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`User logged in: ${userData.email || userData.phone}`);

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          userId: uid,
          email: userData.email,
          phone: userData.phone,
          name: userData.name,
          role: userData.role,
        },
      },
    });
  } catch (error) {
    logger.error("Login error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// GET PROFILE
// GET /api/auth/me
// Protected: requires Firebase token
// ============================================
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      status: "success",
      data: {
        user: {
          userId: req.user.userId,
          email: req.user.email,
          phone: req.user.phone,
          name: req.user.name,
          role: req.user.role,
          createdAt: req.user.createdAt,
          lastLogin: req.user.lastLogin,
        },
      },
    });
  } catch (error) {
    logger.error("Get profile error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to get profile",
    });
  }
};

// ============================================
// UPDATE PROFILE
// PUT /api/auth/profile
// Protected: requires Firebase token
// Body: { name, phone }
// ============================================
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name && name.trim().length >= 2) updates.name = name.trim();
    if (phone) updates.phone = phone;

    await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(req.user.userId)
      .update(updates);

    logger.info(`Profile updated: ${req.user.email}`);

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: {
          userId: req.user.userId,
          email: req.user.email,
          name: updates.name || req.user.name,
          phone: updates.phone || req.user.phone,
          role: req.user.role,
        },
      },
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
// GET ALL USERS (Admin only)
// GET /api/auth/users
// ============================================
const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .get();

    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        userId: doc.id,
        email: data.email,
        phone: data.phone,
        name: data.name,
        role: data.role,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
      });
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
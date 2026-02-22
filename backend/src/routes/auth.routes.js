const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const {
  verifyToken,
  adminOnly,
  anyAuthenticated,
} = require("../middleware/authMiddleware");

// ============================================
// AUTH ROUTES (Firebase Auth)
// Frontend handles sign-in/sign-up via Firebase SDK
// Backend syncs user profile to Firestore
// ============================================

// Sync user after Firebase sign-up (creates Firestore profile)
// POST /api/auth/register
// Header: Authorization: Bearer <Firebase ID Token>
// Body: { name, phone, role }
router.post("/register", authController.register);

// Sync user after Firebase sign-in (updates lastLogin)
// POST /api/auth/login
// Header: Authorization: Bearer <Firebase ID Token>
router.post("/login", authController.login);

// Get current user profile
// GET /api/auth/me
router.get("/me", verifyToken, anyAuthenticated, authController.getProfile);

// Update profile
// PUT /api/auth/profile
router.put("/profile", verifyToken, anyAuthenticated, authController.updateProfile);

// Get all users (admin only)
// GET /api/auth/users
router.get("/users", verifyToken, adminOnly, authController.getAllUsers);

module.exports = router;
const express = require("express");
const router = express.Router();

// Import controller
const authController = require("../controllers/authController");

// Import middleware
const {
  verifyToken,
  adminOnly,
  anyAuthenticated,
} = require("../middleware/authMiddleware");

// ============================================
// PUBLIC ROUTES (No auth needed)
// ============================================

// Register new user
// POST /api/auth/register
// Body: { email, password, name, phone, role }
router.post("/register", authController.register);

// Login user
// POST /api/auth/login
// Body: { email, password }
router.post("/login", authController.login);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// Get current user profile
// GET /api/auth/me
// Header: Authorization: Bearer <token>
router.get("/me", verifyToken, anyAuthenticated, authController.getProfile);

// Update profile
// PUT /api/auth/profile
// Header: Authorization: Bearer <token>
// Body: { name, phone }
router.put(
  "/profile",
  verifyToken,
  anyAuthenticated,
  authController.updateProfile
);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users (admin only)
// GET /api/auth/users
// Header: Authorization: Bearer <token>
router.get("/users", verifyToken, adminOnly, authController.getAllUsers);

module.exports = router;
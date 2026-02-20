const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");
require("dotenv").config();

// ============================================
// VERIFY JWT TOKEN MIDDLEWARE
// ============================================
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "No token provided. Please login first.",
      });
    }

    // Token format: "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token format. Use: Bearer <token>",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database to make sure they still exist
    const userDoc = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(decoded.userId)
      .get();

    if (!userDoc.exists) {
      return res.status(401).json({
        status: "error",
        message: "User no longer exists.",
      });
    }

    // Attach user data to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      ...userDoc.data(),
    };

    logger.debug(`Authenticated user: ${decoded.email} (${decoded.role})`);

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token.",
      });
    }

    logger.error("Auth middleware error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Authentication failed.",
    });
  }
};

// ============================================
// ROLE-BASED ACCESS MIDDLEWARE
// ============================================

// Allow only specific roles
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Access denied for user ${req.user.email}. Role: ${req.user.role}, Required: ${allowedRoles.join(", ")}`
      );
      return res.status(403).json({
        status: "error",
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

// Shortcut middlewares for common role checks
const ownerOnly = requireRole(CONSTANTS.ROLES.OWNER);
const adminOnly = requireRole(CONSTANTS.ROLES.ADMIN);
const ownerOrAdmin = requireRole(CONSTANTS.ROLES.OWNER, CONSTANTS.ROLES.ADMIN);
const anyAuthenticated = requireRole(
  CONSTANTS.ROLES.OWNER,
  CONSTANTS.ROLES.RECEIVER,
  CONSTANTS.ROLES.ADMIN
);

module.exports = {
  verifyToken,
  requireRole,
  ownerOnly,
  adminOnly,
  ownerOrAdmin,
  anyAuthenticated,
};
const { admin, db } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");

// ============================================
// VERIFY FIREBASE ID TOKEN MIDDLEWARE
// Uses Firebase Admin SDK to verify tokens
// issued by Firebase Authentication
// ============================================
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        message: "No token provided. Please login first.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token format. Use: Bearer <token>",
      });
    }

    const idToken = authHeader.split(" ")[1];

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user profile from Firestore (uses Firebase UID as doc ID)
    const userDoc = await db
      .collection(CONSTANTS.COLLECTIONS.USERS)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return res.status(401).json({
        status: "error",
        message: "User profile not found. Please complete registration.",
      });
    }

    const userData = userDoc.data();

    // Attach user data to request
    req.user = {
      userId: uid,
      email: decodedToken.email || userData.email,
      phone: decodedToken.phone_number || userData.phone,
      role: userData.role || CONSTANTS.ROLES.RECEIVER,
      name: userData.name,
      ...userData,
    };

    logger.debug(`Authenticated: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        status: "error",
        message: "Token expired. Please login again.",
      });
    }

    if (error.code === "auth/argument-error" || error.code === "auth/id-token-revoked") {
      return res.status(401).json({
        status: "error",
        message: "Invalid token.",
      });
    }

    logger.error("Auth middleware error:", error.message);
    return res.status(401).json({
      status: "error",
      message: "Authentication failed.",
    });
  }
};

// ============================================
// ROLE-BASED ACCESS MIDDLEWARE
// ============================================
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
        `Access denied for ${req.user.email}. Role: ${req.user.role}, Required: ${allowedRoles.join(", ")}`
      );
      return res.status(403).json({
        status: "error",
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

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
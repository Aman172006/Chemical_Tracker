// ============================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ============================================

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Firebase specific errors
  if (err.code === "auth/email-already-exists") {
    statusCode = 400;
    message = "Email already registered";
  }

  if (err.code === "auth/invalid-email") {
    statusCode = 400;
    message = "Invalid email address";
  }

  if (err.code === "auth/user-not-found") {
    statusCode = 404;
    message = "User not found";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json({
    status: "error",
    statusCode: statusCode,
    message: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: "error",
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFoundHandler };
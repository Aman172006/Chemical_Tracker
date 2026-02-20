console.log("🟢 INDEX.JS LOADED\n");

const http = require("http");
require("dotenv").config();

// ============================================
// CHECK .env FILE EXISTS
// ============================================
if (!process.env.PORT) {
  console.log("⚠️  WARNING: .env file might not be loaded");
  console.log("   Using default PORT 5000\n");
}

console.log("📋 Environment Check:");
console.log("   PORT:", process.env.PORT || "5000 (default)");
console.log("   NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("   FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID || "❌ NOT SET");
console.log("   FIREBASE_DATABASE_URL:", process.env.FIREBASE_DATABASE_URL || "❌ NOT SET");
console.log("");

// ============================================
// IMPORT CONFIGURATIONS
// ============================================
let configureServer;
let firebaseModule;

try {
  console.log("📦 Loading server config...");
  configureServer = require("./config/server");
  console.log("✅ Server config loaded\n");
} catch (error) {
  console.error("❌ Failed to load server config:", error.message);
  process.exit(1);
}

try {
  console.log("📦 Loading Firebase config...");
  firebaseModule = require("./config/firebase");
  console.log("✅ Firebase config loaded\n");
} catch (error) {
  console.error("❌ Failed to load Firebase config:", error.message);
  console.error("   Full error:", error);
  process.exit(1);
}

// ============================================
// MAIN SERVER STARTUP
// ============================================
const startServer = async () => {
  try {
    console.log("==============================================");
    console.log("  CHEMICAL TRACKER BACKEND - Starting Up...");
    console.log("==============================================\n");

    // Step 1: Test Firebase Connection
    console.log("📡 Testing Firebase connection...\n");
    const firebaseConnected = await firebaseModule.testFirebaseConnection();

    if (!firebaseConnected) {
      console.error("\n❌ Cannot start server without Firebase connection.");
      console.error("   Please check your serviceAccountKey.json and .env file.\n");
      process.exit(1);
    }

    console.log("");

    // Step 2: Configure Express App
    const app = configureServer();

    // Step 3: Create HTTP Server (needed for Socket.io later)
    const server = http.createServer(app);

    // Step 4: Start Listening
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log("==============================================");
      console.log(`  ✅ Server running on port ${PORT}`);
      console.log(`  📍 Local:   http://localhost:${PORT}`);
      console.log(`  📍 API:     http://localhost:${PORT}/api/health`);
      console.log(`  🔥 Mode:    ${process.env.NODE_ENV || "development"}`);
      console.log("==============================================\n");
    });

    // Step 5: Handle Errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error("❌ Server error:", error.message);
      }
      process.exit(1);
    });

    // Graceful Shutdown
    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down...");
      server.close(() => process.exit(0));
    });

    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down...");
      server.close(() => process.exit(0));
    });

  } catch (error) {
    console.error("❌ SERVER STARTUP FAILED:", error.message);
    console.error("   Full error:", error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// START
console.log("🚀 Calling startServer()...\n");
startServer();
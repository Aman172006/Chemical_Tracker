console.log("🟢 INDEX.JS LOADED\n");

const http = require("http");
require("dotenv").config();

// Import configurations
let configureServer;
let firebaseModule;
let socketModule;

try {
  configureServer = require("./config/server");
  console.log("✅ Server config loaded");
} catch (error) {
  console.error("❌ Failed to load server config:", error.message);
  process.exit(1);
}

try {
  firebaseModule = require("./config/firebase");
  console.log("✅ Firebase config loaded");
} catch (error) {
  console.error("❌ Failed to load Firebase config:", error.message);
  process.exit(1);
}

try {
  socketModule = require("./websocket/socketHandler");
  console.log("✅ Socket handler loaded");
} catch (error) {
  console.error("❌ Failed to load Socket handler:", error.message);
  process.exit(1);
}

// ============================================
// MAIN SERVER STARTUP
// ============================================
const startServer = async () => {
  try {
    console.log("\n==============================================");
    console.log("  CHEMICAL TRACKER BACKEND - Starting Up...");
    console.log("==============================================\n");

    // Step 1: Test Firebase Connection
    console.log("📡 Testing Firebase connection...\n");
    const firebaseConnected = await firebaseModule.testFirebaseConnection();

    if (!firebaseConnected) {
      console.error("\n❌ Cannot start server without Firebase connection.");
      process.exit(1);
    }

    console.log("");

    // Step 2: Configure Express App
    const app = configureServer();

    // Step 3: Create HTTP Server
    const server = http.createServer(app);

    // Step 4: Initialize Socket.io (ATTACH TO SAME SERVER)
    console.log("📡 Initializing Socket.io...\n");
    const io = socketModule.initializeSocket(server);

    // Make io accessible in routes via app
    app.set("io", io);

    // Step 4.5: Start RTDB Telemetry Listener (bridges ESP32 direct writes)
    console.log("📡 Starting RTDB telemetry listener...\n");
    const { startTelemetryListener } = require("./services/rtdbListener");
    startTelemetryListener();

    // Step 5: Start Listening
    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log("\n==============================================");
      console.log(`  ✅ Server running on port ${PORT}`);
      console.log(`  📍 HTTP API:    http://localhost:${PORT}`);
      console.log(`  📍 Health:      http://localhost:${PORT}/api/health`);
      console.log(`  📍 Routes:      http://localhost:${PORT}/api/routes`);
      console.log(`  📡 WebSocket:   ws://localhost:${PORT}`);
      console.log(`  🔥 Mode:        ${process.env.NODE_ENV || "development"}`);
      console.log("==============================================\n");
    });

    // Error Handling
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error("❌ Server error:", error.message);
      }
      process.exit(1);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log("\n🛑 Shutting down...");
      io.close(() => {
        console.log("✅ Socket.io closed");
        server.close(() => {
          console.log("✅ HTTP server closed");
          process.exit(0);
        });
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (error) {
    console.error("❌ SERVER STARTUP FAILED:", error.message);
    console.error(error);
    process.exit(1);
  }
};

// Handle unhandled errors
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// START
console.log("🚀 Starting server...\n");
startServer();
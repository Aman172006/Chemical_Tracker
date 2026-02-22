const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Import error handlers
const { errorHandler, notFoundHandler } = require("../middleware/errorHandler");

// Import routes
const authRoutes = require("../routes/auth.routes");
const tripRoutes = require("../routes/trip.routes");
const deviceRoutes = require("../routes/device.routes");

// ============================================
// EXPRESS APP CONFIGURATION
// ============================================
const configureServer = () => {
  const app = express();

  // ---- SECURITY MIDDLEWARE ----
  app.use(helmet());

  // ---- CORS MIDDLEWARE ----
  const corsOptions = {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  app.use(cors(corsOptions));

  // ---- BODY PARSING MIDDLEWARE ----
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // ---- LOGGING MIDDLEWARE ----
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // ---- HEALTH CHECK ROUTES ----
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "success",
      message: "ChemTrack API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ---- WEBSOCKET STATUS ----
  app.get("/api/ws-status", (req, res) => {
    const socketHandler = require("../websocket/socketHandler");
    res.status(200).json({
      status: "success",
      data: {
        websocketReady: true,
        connectedClients: socketHandler.getConnectedClients(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ============================================
  // API ROUTES
  // ============================================
  app.use("/api/auth", authRoutes);
  app.use("/api/trip", tripRoutes);
  app.use("/api/device", deviceRoutes);

  // ---- ROUTE LIST (for debugging) ----
  app.get("/api/routes", (req, res) => {
    res.status(200).json({
      status: "success",
      message: "Available API routes",
      routes: {
        auth: {
          "POST /api/auth/register": "Register user (Firebase token + profile data)",
          "POST /api/auth/login": "Sync login (Firebase token)",
          "GET /api/auth/me": "Get profile (auth required)",
          "PUT /api/auth/profile": "Update profile (auth required)",
          "GET /api/auth/users": "Get all users (admin only)",
        },
        trip: {
          "POST /api/trip/create": "Create trip (owner only)",
          "GET /api/trip/list": "List trips (owner/admin)",
          "GET /api/trip/:tripId": "Get trip details (owner/admin)",
          "PUT /api/trip/:tripId/start": "Start trip (owner)",
          "PUT /api/trip/:tripId/complete": "Complete trip (owner/admin)",
          "PUT /api/trip/:tripId/cancel": "Cancel trip (owner)",
          "GET /api/trip/:tripId/secret-ids": "Get secret IDs (owner/admin)",
          "POST /api/trip/validate-secret-id": "Validate secret ID (public)",
          "POST /api/trip/live": "Get live data (public, needs secret ID)",
        },
        device: {
          "POST /api/device/data": "Receive ESP32 sensor data (no auth)",
          "POST /api/device/register": "Register device to trip (no auth)",
          "GET /api/device/status/:tripId": "Get live device status (no auth)",
          "GET /api/device/alerts/:tripId": "Get trip alerts (auth)",
          "PUT /api/device/alerts/:alertId/resolve": "Resolve alert (auth)",
          "GET /api/device/alerts/all/active": "All active alerts (admin)",
          "GET /api/device/tracking/:tripId": "Tracking history (auth)",
        },
        websocket: {
          "Event: join-trip": "Client joins trip room (send tripId)",
          "Event: leave-trip": "Client leaves trip room",
          "Event: join-owner-room": "Owner joins personal room (send ownerId)",
          "Event: join-admin-room": "Admin joins alert room",
          "Event: tracking-update": "Server sends live GPS + sensor data",
          "Event: new-alert": "Server sends alert notification",
          "Event: new-secret-id": "Server sends new ID (owner only)",
          "Event: secret-id-rotated": "Server notifies ID changed (all)",
          "Event: trip-status-changed": "Server sends trip status update",
          "Event: device-status": "Server sends device connection status",
          "GET /api/ws-status": "Check WebSocket connection count",
        },
      },
    });
  });

  // ---- ERROR HANDLERS (must be AFTER all routes) ----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = configureServer;
const express = require("express");
const router = express.Router();

// Import controller
const deviceController = require("../controllers/deviceController");

// Import middleware
const {
  verifyToken,
  ownerOrAdmin,
  adminOnly,
} = require("../middleware/authMiddleware");

// ============================================
// DEVICE ROUTES (No auth - called by ESP32)
// ============================================

// Receive sensor data from ESP32
// POST /api/device/data
// Body: { deviceId, tripId, location, weight, sealStatus, deviceAttached, batteryLevel }
router.post("/data", deviceController.receiveDeviceData);

// Register device to a trip
// POST /api/device/register
// Body: { deviceId, tripId, initialWeight }
router.post("/register", deviceController.registerDevice);

// Get device live status
// GET /api/device/status/:tripId
router.get("/status/:tripId", deviceController.getDeviceStatus);

// ============================================
// ALERT ROUTES (Auth required)
// ============================================

// Get all active alerts (Admin)
// GET /api/device/alerts/all/active
router.get(
  "/alerts/all/active",
  verifyToken,
  adminOnly,
  deviceController.getAllActive
);

// Get alerts for a trip
// GET /api/device/alerts/:tripId
router.get(
  "/alerts/:tripId",
  verifyToken,
  ownerOrAdmin,
  deviceController.getAlerts
);

// Resolve an alert
// PUT /api/device/alerts/:alertId/resolve
router.put(
  "/alerts/:alertId/resolve",
  verifyToken,
  ownerOrAdmin,
  deviceController.resolveAlertRoute
);

// ============================================
// TRACKING HISTORY (Auth required)
// ============================================

// Get tracking history for a trip
// GET /api/device/tracking/:tripId
router.get(
  "/tracking/:tripId",
  verifyToken,
  ownerOrAdmin,
  deviceController.getTrackingHistory
);

module.exports = router;
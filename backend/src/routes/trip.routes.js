const express = require("express");
const router = express.Router();

// Import controller
const tripController = require("../controllers/tripController");

// Import middleware
const {
  verifyToken,
  ownerOnly,
  ownerOrAdmin,
  anyAuthenticated,
} = require("../middleware/authMiddleware");

// ============================================
// PUBLIC ROUTES (No auth - for receivers)
// ============================================

// Validate secret ID and get tracking access
// POST /api/trip/validate-secret-id
// Body: { secretId: "ABC123DEF456" }
router.post("/validate-secret-id", tripController.validateSecretIdRoute);

// Get live data using secret ID
// POST /api/trip/live
// Body: { secretId: "ABC123DEF456" }
router.post("/live", tripController.getTripLiveData);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// Create new trip (Owner only)
// POST /api/trip/create
router.post("/create", verifyToken, ownerOnly, tripController.createTrip);

// Get all trips (Owner sees own, Admin sees all)
// GET /api/trip/list
router.get("/list", verifyToken, ownerOrAdmin, tripController.getAllTrips);

// Get single trip by ID
// GET /api/trip/:tripId
router.get("/:tripId", verifyToken, ownerOrAdmin, tripController.getTripById);

// Start trip
// PUT /api/trip/:tripId/start
router.put(
  "/:tripId/start",
  verifyToken,
  ownerOnly,
  tripController.startTrip
);

// Complete trip
// PUT /api/trip/:tripId/complete
router.put(
  "/:tripId/complete",
  verifyToken,
  ownerOrAdmin,
  tripController.completeTrip
);

// Cancel trip
// PUT /api/trip/:tripId/cancel
router.put(
  "/:tripId/cancel",
  verifyToken,
  ownerOnly,
  tripController.cancelTrip
);

// Get secret IDs for a trip (Owner/Admin only)
// GET /api/trip/:tripId/secret-ids
router.get(
  "/:tripId/secret-ids",
  verifyToken,
  ownerOrAdmin,
  tripController.getSecretIds
);

// Reroute trip (owner redefines path when road blocked)
// PUT /api/trip/:tripId/reroute
router.put(
  "/:tripId/reroute",
  verifyToken,
  ownerOnly,
  tripController.rerouteTrip
);

module.exports = router;
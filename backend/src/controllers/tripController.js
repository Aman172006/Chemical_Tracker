const { db, admin, rtdb } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");
const { generateTripId, generateContainerId } = require("../utils/idGenerator");
const { createNewSecretId, getTripSecretIds, validateSecretId, logSecretIdAccess } = require("../services/idGeneratorService");
const { totalRouteDistance } = require("../utils/distanceCalculator");

// ============================================
// CREATE NEW TRIP
// POST /api/trip/create
// Role: Owner only
// ============================================
const createTrip = async (req, res) => {
  try {
    const {
      startLocation,
      endLocation,
      plannedRoute,
      checkpoints,
      chemicalName,
      chemicalQuantity,
      receiverEmail,
      receiverPhone,
      notes,
    } = req.body;

    // --- VALIDATION ---
    if (!startLocation || !startLocation.lat || !startLocation.lng) {
      return res.status(400).json({
        status: "error",
        message: "Start location required with lat and lng",
      });
    }

    if (!endLocation || !endLocation.lat || !endLocation.lng) {
      return res.status(400).json({
        status: "error",
        message: "End location required with lat and lng",
      });
    }

    // --- GENERATE IDS ---
    const tripId = generateTripId();
    const containerId = generateContainerId();

    // --- BUILD ROUTE ---
    // If no planned route provided, create simple start-to-end route
    const route = plannedRoute && plannedRoute.length > 0
      ? plannedRoute
      : [startLocation, endLocation];

    // --- CREATE TRIP DOCUMENT ---
    const tripData = {
      tripId: tripId,
      containerId: containerId,
      ownerId: req.user.userId,
      ownerEmail: req.user.email,
      ownerName: req.user.name,

      // Receiver info
      receiverEmail: receiverEmail || null,
      receiverPhone: receiverPhone || null,

      // Chemical info
      chemicalName: chemicalName || "Not specified",
      chemicalQuantity: chemicalQuantity || "Not specified",

      // Locations
      startLocation: {
        lat: startLocation.lat,
        lng: startLocation.lng,
        address: startLocation.address || "",
      },
      endLocation: {
        lat: endLocation.lat,
        lng: endLocation.lng,
        address: endLocation.address || "",
      },
      plannedRoute: route,
      totalDistance: totalRouteDistance(route),

      // Weight tracking
      baseWeight: null, // Set when device sends first reading
      currentWeight: null,

      // Secret ID (will be set after generation)
      currentSecretId: null,
      lastSecretIdGeneratedAt: null,
      lastSecretIdLocation: null,

      // Status
      status: CONSTANTS.TRIP_STATUS.CREATED,

      // Metadata
      notes: notes || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      startedAt: null,
      completedAt: null,

      // Tracking
      lastLocation: null,
      lastDataReceivedAt: null,
      deviceId: null,

      // Stats
      totalAlerts: 0,
      distanceCovered: 0,

      // Checkpoints
      checkpoints: Array.isArray(checkpoints) ? checkpoints : [],
      checkpointsCrossed: [],
      checkpointsPending: Array.isArray(checkpoints) ? checkpoints.map(c => c.order) : [],

      // Security — permanent flags
      compromised: false,
      deviationHistory: [],
      rerouteHistory: [],
    };

    // --- SAVE TO FIRESTORE ---
    await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .set(tripData);

    // --- CREATE CONTAINER DOCUMENT ---
    const containerData = {
      containerId: containerId,
      tripId: tripId,
      ownerId: req.user.userId,
      deviceId: null,
      status: CONSTANTS.CONTAINER_STATUS.IDLE,
      sealStatus: CONSTANTS.SEAL_STATUS.INTACT,
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: null,
    };

    await db
      .collection(CONSTANTS.COLLECTIONS.CONTAINERS)
      .doc(containerId)
      .set(containerData);

    // --- GENERATE FIRST SECRET ID ---
    const firstSecretId = await createNewSecretId(
      tripId,
      "PENDING_DEVICE",
      startLocation
    );

    // --- INITIALIZE REALTIME DATABASE ---
    await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).set({
      currentLocation: {
        lat: startLocation.lat,
        lng: startLocation.lng,
        timestamp: Date.now(),
      },
      weight: null,
      sealStatus: CONSTANTS.SEAL_STATUS.INTACT,
      deviceAttached: false,
      batteryLevel: null,
      lastUpdate: Date.now(),
      status: CONSTANTS.TRIP_STATUS.CREATED,
    });

    logger.success(`Trip created: ${tripId} by ${req.user.email}`);

    return res.status(201).json({
      status: "success",
      message: "Trip created successfully",
      data: {
        tripId: tripId,
        containerId: containerId,
        secretId: firstSecretId.secretId,
        trip: tripData,
      },
    });
  } catch (error) {
    logger.error("Create trip error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to create trip",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// GET ALL TRIPS (Owner sees own, Admin sees all)
// GET /api/trip/list
// ============================================
const getAllTrips = async (req, res) => {
  try {
    let query;

    if (req.user.role === CONSTANTS.ROLES.ADMIN) {
      // Admin sees all trips
      query = db
        .collection(CONSTANTS.COLLECTIONS.TRIPS)
        .orderBy("createdAt", "desc");
    } else {
      // Owner sees only their trips (no orderBy to avoid composite index requirement)
      query = db
        .collection(CONSTANTS.COLLECTIONS.TRIPS)
        .where("ownerId", "==", req.user.userId);
    }

    const snapshot = await query.get();

    const trips = [];
    snapshot.forEach((doc) => {
      trips.push(doc.data());
    });

    // Sort by createdAt descending (client-side for owner queries)
    trips.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });

    return res.status(200).json({
      status: "success",
      data: {
        count: trips.length,
        trips: trips,
      },
    });
  } catch (error) {
    logger.error("Get all trips error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch trips",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// GET SINGLE TRIP BY ID
// GET /api/trip/:tripId
// ============================================
const getTripById = async (req, res) => {
  try {
    const { tripId } = req.params;

    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    const tripData = tripDoc.data();

    // Check access: Owner can see own trips, Admin can see all
    if (
      req.user.role !== CONSTANTS.ROLES.ADMIN &&
      tripData.ownerId !== req.user.userId
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. You can only view your own trips.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        trip: tripData,
      },
    });
  } catch (error) {
    logger.error("Get trip error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch trip",
    });
  }
};

// ============================================
// START TRIP (Activate)
// PUT /api/trip/:tripId/start
// Role: Owner only
// ============================================
const startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    const tripData = tripDoc.data();

    // Verify ownership
    if (tripData.ownerId !== req.user.userId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Not your trip.",
      });
    }

    // Check current status
    if (tripData.status !== CONSTANTS.TRIP_STATUS.CREATED) {
      return res.status(400).json({
        status: "error",
        message: `Cannot start trip. Current status: ${tripData.status}`,
      });
    }

    // Update trip status
    await db.collection(CONSTANTS.COLLECTIONS.TRIPS).doc(tripId).update({
      status: CONSTANTS.TRIP_STATUS.ACTIVE,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update container status
    if (tripData.containerId) {
      await db
        .collection(CONSTANTS.COLLECTIONS.CONTAINERS)
        .doc(tripData.containerId)
        .update({
          status: CONSTANTS.CONTAINER_STATUS.IN_TRANSIT,
        });
    }

    // Update Realtime Database
    await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).update({
      status: CONSTANTS.TRIP_STATUS.ACTIVE,
      lastUpdate: Date.now(),
    });

    logger.success(`Trip started: ${tripId}`);

    return res.status(200).json({
      status: "success",
      message: "Trip started successfully",
      data: {
        tripId: tripId,
        status: CONSTANTS.TRIP_STATUS.ACTIVE,
      },
    });
  } catch (error) {
    logger.error("Start trip error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to start trip",
    });
  }
};

// ============================================
// COMPLETE TRIP
// PUT /api/trip/:tripId/complete
// Role: Owner only
// ============================================
const completeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    const tripData = tripDoc.data();

    // Verify ownership
    if (
      tripData.ownerId !== req.user.userId &&
      req.user.role !== CONSTANTS.ROLES.ADMIN
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    // Update trip
    await db.collection(CONSTANTS.COLLECTIONS.TRIPS).doc(tripId).update({
      status: CONSTANTS.TRIP_STATUS.COMPLETED,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update container
    if (tripData.containerId) {
      await db
        .collection(CONSTANTS.COLLECTIONS.CONTAINERS)
        .doc(tripData.containerId)
        .update({
          status: CONSTANTS.CONTAINER_STATUS.DELIVERED,
        });
    }

    // Update Realtime Database
    await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).update({
      status: CONSTANTS.TRIP_STATUS.COMPLETED,
      lastUpdate: Date.now(),
    });

    // Expire all active secret IDs
    const activeIds = await db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .where("tripId", "==", tripId)
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    activeIds.forEach((doc) => {
      batch.update(doc.ref, {
        isActive: false,
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    logger.success(`Trip completed: ${tripId}`);

    return res.status(200).json({
      status: "success",
      message: "Trip completed successfully",
      data: {
        tripId: tripId,
        status: CONSTANTS.TRIP_STATUS.COMPLETED,
      },
    });
  } catch (error) {
    logger.error("Complete trip error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to complete trip",
    });
  }
};

// ============================================
// CANCEL TRIP
// PUT /api/trip/:tripId/cancel
// Role: Owner only
// ============================================
const cancelTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    const tripData = tripDoc.data();

    if (tripData.ownerId !== req.user.userId) {
      return res.status(403).json({
        status: "error",
        message: "Access denied.",
      });
    }

    if (tripData.status === CONSTANTS.TRIP_STATUS.COMPLETED) {
      return res.status(400).json({
        status: "error",
        message: "Cannot cancel a completed trip",
      });
    }

    // Update trip
    await db.collection(CONSTANTS.COLLECTIONS.TRIPS).doc(tripId).update({
      status: CONSTANTS.TRIP_STATUS.CANCELLED,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update container
    if (tripData.containerId) {
      await db
        .collection(CONSTANTS.COLLECTIONS.CONTAINERS)
        .doc(tripData.containerId)
        .update({
          status: CONSTANTS.CONTAINER_STATUS.IDLE,
        });
    }

    // Clean up Realtime Database
    await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).remove();

    // Expire all secret IDs
    const activeIds = await db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .where("tripId", "==", tripId)
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    activeIds.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });
    await batch.commit();

    logger.success(`Trip cancelled: ${tripId}`);

    return res.status(200).json({
      status: "success",
      message: "Trip cancelled",
      data: { tripId, status: CONSTANTS.TRIP_STATUS.CANCELLED },
    });
  } catch (error) {
    logger.error("Cancel trip error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to cancel trip",
    });
  }
};

// ============================================
// GET SECRET IDS FOR A TRIP (Owner only)
// GET /api/trip/:tripId/secret-ids
// ============================================
const getSecretIds = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Verify trip exists and user owns it
    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    const tripData = tripDoc.data();

    if (
      tripData.ownerId !== req.user.userId &&
      req.user.role !== CONSTANTS.ROLES.ADMIN
    ) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Only trip owner can view secret IDs.",
      });
    }

    const secretIds = await getTripSecretIds(tripId);

    return res.status(200).json({
      status: "success",
      data: {
        tripId: tripId,
        currentSecretId: tripData.currentSecretId,
        totalIds: secretIds.length,
        secretIds: secretIds,
      },
    });
  } catch (error) {
    logger.error("Get secret IDs error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch secret IDs",
    });
  }
};

// ============================================
// VALIDATE SECRET ID (Receiver uses this)
// POST /api/trip/validate-secret-id
// PUBLIC - No auth needed
// ============================================
const validateSecretIdRoute = async (req, res) => {
  try {
    const { secretId } = req.body;

    if (!secretId) {
      return res.status(400).json({
        status: "error",
        message: "Secret ID is required",
      });
    }

    const result = await validateSecretId(secretId);

    if (!result.valid) {
      return res.status(401).json({
        status: "error",
        message: result.message,
      });
    }

    // Log access
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await logSecretIdAccess(secretId, "anonymous_receiver", clientIp);

    // Get live data from Realtime Database
    const liveSnapshot = await rtdb
      .ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${result.tripId}`)
      .once("value");
    const liveData = liveSnapshot.val();

    // Return limited trip info (not everything)
    return res.status(200).json({
      status: "success",
      message: "Access granted",
      data: {
        tripId: result.tripId,
        chemicalName: result.trip.chemicalName,
        startLocation: result.trip.startLocation,
        endLocation: result.trip.endLocation,
        status: result.trip.status,
        liveData: liveData,
      },
    });
  } catch (error) {
    logger.error("Validate secret ID error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Validation failed",
    });
  }
};

// ============================================
// GET TRIP LIVE DATA (For receivers with valid secret ID)
// POST /api/trip/live
// PUBLIC - Requires secret ID in body
// ============================================
const getTripLiveData = async (req, res) => {
  try {
    const { secretId } = req.body;

    if (!secretId) {
      return res.status(400).json({
        status: "error",
        message: "Secret ID is required",
      });
    }

    const result = await validateSecretId(secretId);

    if (!result.valid) {
      return res.status(401).json({
        status: "error",
        message: result.message,
      });
    }

    // Get live data
    const liveSnapshot = await rtdb
      .ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${result.tripId}`)
      .once("value");
    const liveData = liveSnapshot.val();

    // Get recent tracking data
    const trackingSnapshot = await db
      .collection(CONSTANTS.COLLECTIONS.TRACKING_DATA)
      .where("tripId", "==", result.tripId)
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    const trackingHistory = [];
    trackingSnapshot.forEach((doc) => {
      trackingHistory.push(doc.data());
    });

    return res.status(200).json({
      status: "success",
      data: {
        tripId: result.tripId,
        live: liveData,
        history: trackingHistory,
        trip: {
          chemicalName: result.trip.chemicalName,
          startLocation: result.trip.startLocation,
          endLocation: result.trip.endLocation,
          status: result.trip.status,
        },
      },
    });
  } catch (error) {
    logger.error("Get live data error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch live data",
    });
  }
};

// ============================================
// REROUTE TRIP (Owner sets new path)
// PUT /api/trip/:tripId/reroute
// Role: Owner only
// ============================================
const rerouteTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { newRoute, newCheckpoints, reason } = req.body;

    if (!newRoute || newRoute.length < 2) {
      return res.status(400).json({
        status: "error",
        message: "New route must have at least 2 points",
      });
    }

    // Get trip
    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .get();

    if (!tripDoc.exists) {
      return res.status(404).json({
        status: "error",
        message: "Trip not found",
      });
    }

    const tripData = tripDoc.data();

    // Only active trips can be rerouted
    if (tripData.status !== CONSTANTS.TRIP_STATUS.ACTIVE) {
      return res.status(400).json({
        status: "error",
        message: "Only active trips can be rerouted",
      });
    }

    // Store old route in reroute history (permanent audit log)
    const rerouteEntry = {
      timestamp: new Date().toISOString(),
      reason: reason || "Road blocked",
      previousRoute: tripData.plannedRoute,
      previousCheckpoints: tripData.checkpoints || [],
      newRoute: newRoute,
      newCheckpoints: newCheckpoints || [],
      reroutedBy: req.user.userId,
    };

    // Update trip
    const updates = {
      plannedRoute: newRoute,
      endLocation: {
        lat: newRoute[newRoute.length - 1].lat,
        lng: newRoute[newRoute.length - 1].lng,
        address: req.body.newEndAddress || tripData.endLocation.address,
      },
      checkpoints: newCheckpoints || [],
      checkpointsCrossed: [],
      checkpointsPending: newCheckpoints ? newCheckpoints.map(c => c.order) : [],
      totalDistance: totalRouteDistance(newRoute),
      rerouteHistory: admin.firestore.FieldValue.arrayUnion(rerouteEntry),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .update(updates);

    // Broadcast via Socket.io
    const socketHandler = require("../websocket/socketHandler");
    socketHandler.broadcastTripStatusChange(tripId, {
      type: "rerouted",
      tripId,
      newRoute,
      newCheckpoints: newCheckpoints || [],
      reason: reason || "Road blocked",
    });

    logger.success(`Trip ${tripId} rerouted by ${req.user.email}`);

    return res.status(200).json({
      status: "success",
      message: "Trip rerouted successfully",
      data: {
        tripId,
        newRoute,
        newCheckpoints: newCheckpoints || [],
      },
    });
  } catch (error) {
    logger.error("Reroute trip error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to reroute trip",
    });
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  startTrip,
  completeTrip,
  cancelTrip,
  getSecretIds,
  validateSecretIdRoute,
  getTripLiveData,
  rerouteTrip,
};
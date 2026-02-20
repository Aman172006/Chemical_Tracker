const { db, admin, rtdb } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");
const { createNewSecretId } = require("../services/idGeneratorService");
const { shouldGenerateNewId, checkDeviation, getTripProgress } = require("../services/geofenceService");
const {
  checkWeightAlert,
  checkSealAlert,
  checkDeviceDetachAlert,
  checkRouteDeviationAlert,
  checkBatteryAlert,
  getTripAlerts,
  resolveAlert,
  getAllActiveAlerts,
} = require("../services/alertService");
const { getDistance } = require("../utils/distanceCalculator");

// ============================================
// RECEIVE DATA FROM ESP32 DEVICE
// POST /api/device/data
// This is called by ESP32 every 10 seconds
// NO AUTH - Device uses deviceId for identification
// ============================================
const receiveDeviceData = async (req, res) => {
  try {
    const {
      deviceId,
      tripId,
      location,
      weight,
      sealStatus,
      deviceAttached,
      batteryLevel,
    } = req.body;

    // --- VALIDATION ---
    if (!deviceId || !tripId) {
      return res.status(400).json({
        status: "error",
        message: "deviceId and tripId are required",
      });
    }

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({
        status: "error",
        message: "location with lat and lng is required",
      });
    }

    // --- GET TRIP DATA ---
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

    // Check if trip is active
    if (
      tripData.status !== CONSTANTS.TRIP_STATUS.ACTIVE &&
      tripData.status !== CONSTANTS.TRIP_STATUS.CREATED &&
      tripData.status !== CONSTANTS.TRIP_STATUS.ALERT
    ) {
      return res.status(400).json({
        status: "error",
        message: `Trip is ${tripData.status}. Cannot receive data.`,
      });
    }

    const currentLocation = {
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lng),
    };

    const currentWeight = weight !== null && weight !== undefined ? parseFloat(weight) : null;
    const currentSealStatus = sealStatus || CONSTANTS.SEAL_STATUS.INTACT;
    const isDeviceAttached = deviceAttached !== false;
    const currentBattery = batteryLevel !== null && batteryLevel !== undefined ? parseFloat(batteryLevel) : null;

    // ============================================
    // PROCESS ALERTS
    // ============================================
    const alerts = [];

    // 1. Weight Check
    if (currentWeight !== null && tripData.baseWeight !== null) {
      const weightAlert = await checkWeightAlert(
        tripId,
        deviceId,
        tripData.baseWeight,
        currentWeight,
        currentLocation
      );
      if (weightAlert) alerts.push(weightAlert);
    }

    // 2. Seal Check
    const sealAlert = await checkSealAlert(
      tripId,
      deviceId,
      currentSealStatus,
      currentLocation
    );
    if (sealAlert) alerts.push(sealAlert);

    // 3. Device Detach Check
    const detachAlert = await checkDeviceDetachAlert(
      tripId,
      deviceId,
      isDeviceAttached,
      currentLocation
    );
    if (detachAlert) alerts.push(detachAlert);

    // 4. Route Deviation Check
    if (tripData.plannedRoute && tripData.plannedRoute.length > 0) {
      const deviationResult = checkDeviation(
        currentLocation,
        tripData.plannedRoute
      );
      const routeAlert = await checkRouteDeviationAlert(
        tripId,
        deviceId,
        deviationResult,
        currentLocation
      );
      if (routeAlert) alerts.push(routeAlert);
    }

    // 5. Battery Check
    if (currentBattery !== null) {
      const batteryAlert = await checkBatteryAlert(
        tripId,
        deviceId,
        currentBattery,
        currentLocation
      );
      if (batteryAlert) alerts.push(batteryAlert);
    }

    // ============================================
    // CHECK SECRET ID GENERATION
    // ============================================
    let newSecretId = null;

    const idCheck = shouldGenerateNewId(
      currentLocation,
      tripData.lastSecretIdLocation
    );

    if (idCheck.shouldGenerate) {
      const idResult = await createNewSecretId(
        tripId,
        deviceId,
        currentLocation
      );
      newSecretId = idResult.secretId;

      logger.info(
        `New Secret ID generated for trip ${tripId}: ${newSecretId} (distance: ${idCheck.distance}m)`
      );
    }

    // ============================================
    // CALCULATE DISTANCE COVERED
    // ============================================
    let distanceFromLast = 0;
    if (tripData.lastLocation) {
      distanceFromLast = getDistance(currentLocation, tripData.lastLocation);
    }

    const totalDistanceCovered =
      (tripData.distanceCovered || 0) + distanceFromLast;

    // Calculate trip progress
    const progress = getTripProgress(
      currentLocation,
      tripData.startLocation,
      tripData.endLocation
    );

    // ============================================
    // SAVE TRACKING DATA TO FIRESTORE
    // ============================================
    const trackingData = {
      tripId: tripId,
      deviceId: deviceId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timestampMs: Date.now(),
      location: currentLocation,
      sensors: {
        weight: currentWeight,
        sealStatus: currentSealStatus,
        deviceAttached: isDeviceAttached,
        batteryLevel: currentBattery,
      },
      distanceFromLast: Math.round(distanceFromLast),
      totalDistanceCovered: Math.round(totalDistanceCovered),
      progress: progress,
      alerts: alerts.map((a) => a.alertId),
      newSecretId: newSecretId,
    };

    await db.collection(CONSTANTS.COLLECTIONS.TRACKING_DATA).add(trackingData);

    // ============================================
    // UPDATE TRIP DOCUMENT
    // ============================================
    const tripUpdate = {
      lastLocation: currentLocation,
      lastDataReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
      deviceId: deviceId,
      currentWeight: currentWeight,
      distanceCovered: Math.round(totalDistanceCovered),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Set base weight on first reading
    if (tripData.baseWeight === null && currentWeight !== null) {
      tripUpdate.baseWeight = currentWeight;
      logger.info(
        `Base weight set for trip ${tripId}: ${currentWeight} kg`
      );
    }

    // Auto-activate trip if still in "created" status
    if (tripData.status === CONSTANTS.TRIP_STATUS.CREATED) {
      tripUpdate.status = CONSTANTS.TRIP_STATUS.ACTIVE;
      tripUpdate.startedAt = admin.firestore.FieldValue.serverTimestamp();
      logger.info(`Trip auto-activated: ${tripId}`);
    }

    await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .update(tripUpdate);

    // ============================================
    // UPDATE REALTIME DATABASE (for live tracking)
    // ============================================
    await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).update({
      currentLocation: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        timestamp: Date.now(),
      },
      weight: currentWeight,
      sealStatus: currentSealStatus,
      deviceAttached: isDeviceAttached,
      batteryLevel: currentBattery,
      lastUpdate: Date.now(),
      progress: progress,
      distanceCovered: Math.round(totalDistanceCovered),
      status: alerts.length > 0 ? CONSTANTS.TRIP_STATUS.ALERT : tripData.status,
    });

    // ============================================
    // UPDATE CONTAINER DOCUMENT
    // ============================================
    if (tripData.containerId) {
      await db
        .collection(CONSTANTS.COLLECTIONS.CONTAINERS)
        .doc(tripData.containerId)
        .update({
          deviceId: deviceId,
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          sealStatus: currentSealStatus,
          status:
            currentSealStatus === CONSTANTS.SEAL_STATUS.TAMPERED
              ? CONSTANTS.CONTAINER_STATUS.TAMPERED
              : CONSTANTS.CONTAINER_STATUS.IN_TRANSIT,
        });
    }

    // ============================================
    // BUILD RESPONSE FOR ESP32
    // ============================================
    const response = {
      status: "success",
      message: "Data received",
      data: {
        received: true,
        alerts: alerts.length,
        newSecretId: newSecretId ? true : false,
        distanceToNextId: newSecretId
          ? CONSTANTS.THRESHOLDS.SECRET_ID_DISTANCE_M
          : CONSTANTS.THRESHOLDS.SECRET_ID_DISTANCE_M - idCheck.distance,
        progress: progress,
      },
    };

    logger.device(
      deviceId,
      `Data processed | Lat: ${currentLocation.lat}, Lng: ${currentLocation.lng} | Weight: ${currentWeight} | Alerts: ${alerts.length}`
    );

    return res.status(200).json(response);
  } catch (error) {
    logger.error("Device data processing error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to process device data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================
// REGISTER DEVICE TO A TRIP
// POST /api/device/register
// ============================================
const registerDevice = async (req, res) => {
  try {
    const { deviceId, tripId, initialWeight } = req.body;

    if (!deviceId || !tripId) {
      return res.status(400).json({
        status: "error",
        message: "deviceId and tripId are required",
      });
    }

    // Verify trip exists
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

    // Update trip with device info
    const updateData = {
      deviceId: deviceId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (initialWeight !== null && initialWeight !== undefined) {
      updateData.baseWeight = parseFloat(initialWeight);
      updateData.currentWeight = parseFloat(initialWeight);
    }

    await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(tripId)
      .update(updateData);

    // Update container
    if (tripData.containerId) {
      await db
        .collection(CONSTANTS.COLLECTIONS.CONTAINERS)
        .doc(tripData.containerId)
        .update({
          deviceId: deviceId,
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    // Update Realtime Database
    await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).update({
      deviceAttached: true,
      weight: initialWeight ? parseFloat(initialWeight) : null,
      lastUpdate: Date.now(),
    });

    logger.success(
      `Device ${deviceId} registered to trip ${tripId} with base weight: ${initialWeight}`
    );

    return res.status(200).json({
      status: "success",
      message: "Device registered successfully",
      data: {
        deviceId: deviceId,
        tripId: tripId,
        baseWeight: initialWeight || null,
      },
    });
  } catch (error) {
    logger.error("Device registration error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to register device",
    });
  }
};

// ============================================
// GET DEVICE STATUS
// GET /api/device/status/:tripId
// ============================================
const getDeviceStatus = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Get live data from Realtime Database
    const liveSnapshot = await rtdb
      .ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`)
      .once("value");

    const liveData = liveSnapshot.val();

    if (!liveData) {
      return res.status(404).json({
        status: "error",
        message: "No live data found for this trip",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        tripId: tripId,
        live: liveData,
      },
    });
  } catch (error) {
    logger.error("Get device status error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to get device status",
    });
  }
};

// ============================================
// GET ALERTS FOR A TRIP
// GET /api/device/alerts/:tripId
// ============================================
const getAlerts = async (req, res) => {
  try {
    const { tripId } = req.params;

    const alerts = await getTripAlerts(tripId);

    return res.status(200).json({
      status: "success",
      data: {
        tripId: tripId,
        count: alerts.length,
        alerts: alerts,
      },
    });
  } catch (error) {
    logger.error("Get alerts error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to get alerts",
    });
  }
};

// ============================================
// RESOLVE AN ALERT
// PUT /api/device/alerts/:alertId/resolve
// ============================================
const resolveAlertRoute = async (req, res) => {
  try {
    const { alertId } = req.params;

    const result = await resolveAlert(alertId, req.user.userId);

    if (result) {
      return res.status(200).json({
        status: "success",
        message: "Alert resolved",
      });
    } else {
      return res.status(500).json({
        status: "error",
        message: "Failed to resolve alert",
      });
    }
  } catch (error) {
    logger.error("Resolve alert error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to resolve alert",
    });
  }
};

// ============================================
// GET ALL ACTIVE ALERTS (ADMIN)
// GET /api/device/alerts/all/active
// ============================================
const getAllActive = async (req, res) => {
  try {
    const alerts = await getAllActiveAlerts();

    return res.status(200).json({
      status: "success",
      data: {
        count: alerts.length,
        alerts: alerts,
      },
    });
  } catch (error) {
    logger.error("Get all active alerts error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to get active alerts",
    });
  }
};

// ============================================
// GET TRACKING HISTORY
// GET /api/device/tracking/:tripId
// ============================================
const getTrackingHistory = async (req, res) => {
  try {
    const { tripId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const snapshot = await db
      .collection(CONSTANTS.COLLECTIONS.TRACKING_DATA)
      .where("tripId", "==", tripId)
      .orderBy("timestampMs", "desc")
      .limit(limit)
      .get();

    const trackingData = [];
    snapshot.forEach((doc) => {
      trackingData.push(doc.data());
    });

    return res.status(200).json({
      status: "success",
      data: {
        tripId: tripId,
        count: trackingData.length,
        tracking: trackingData,
      },
    });
  } catch (error) {
    logger.error("Get tracking history error:", error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to get tracking history",
    });
  }
};

module.exports = {
  receiveDeviceData,
  registerDevice,
  getDeviceStatus,
  getAlerts,
  resolveAlertRoute,
  getAllActive,
  getTrackingHistory,
};
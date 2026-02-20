const { db, admin, rtdb } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");
const { generateAlertId } = require("../utils/idGenerator");

// ============================================
// ALERT SERVICE
// ============================================

/**
 * Create a new alert
 */
const createAlert = async (alertData) => {
  try {
    const alertId = generateAlertId();

    const alert = {
      alertId: alertId,
      tripId: alertData.tripId,
      deviceId: alertData.deviceId || null,
      containerId: alertData.containerId || null,
      type: alertData.type,
      severity: alertData.severity || CONSTANTS.ALERT_SEVERITY.MEDIUM,
      message: alertData.message,
      details: alertData.details || {},
      location: alertData.location || { lat: 0, lng: 0 },
      sensorData: alertData.sensorData || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timestampMs: Date.now(),
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      notifiedUsers: alertData.notifiedUsers || [],
    };

    // Save to Firestore
    await db
      .collection(CONSTANTS.COLLECTIONS.ALERTS)
      .doc(alertId)
      .set(alert);

    // Save to Realtime Database for instant access
    await rtdb
      .ref(`${CONSTANTS.RTDB_PATHS.ACTIVE_ALERTS}/${alertData.tripId}/${alertId}`)
      .set({
        alertId: alertId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        location: alert.location,
        timestamp: Date.now(),
        resolved: false,
      });

    // Update trip alert count
    await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(alertData.tripId)
      .update({
        totalAlerts: admin.firestore.FieldValue.increment(1),
        status: CONSTANTS.TRIP_STATUS.ALERT,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.alert(
      alert.type,
      `Trip: ${alertData.tripId} | ${alert.message}`
    );

    return alert;
  } catch (error) {
    logger.error("Create alert failed:", error.message);
    throw error;
  }
};

/**
 * Check weight and create alert if needed
 */
const checkWeightAlert = async (tripId, deviceId, baseWeight, currentWeight, location) => {
  const tolerance = CONSTANTS.THRESHOLDS.WEIGHT_TOLERANCE_KG;
  const weightDiff = baseWeight - currentWeight;

  if (weightDiff > tolerance) {
    const alert = await createAlert({
      tripId: tripId,
      deviceId: deviceId,
      type: CONSTANTS.ALERT_TYPES.WEIGHT_DECREASE,
      severity:
        weightDiff > 5
          ? CONSTANTS.ALERT_SEVERITY.CRITICAL
          : weightDiff > 2
          ? CONSTANTS.ALERT_SEVERITY.HIGH
          : CONSTANTS.ALERT_SEVERITY.MEDIUM,
      message: `Weight decreased by ${weightDiff.toFixed(2)} kg (Base: ${baseWeight} kg, Current: ${currentWeight} kg)`,
      details: {
        baseWeight: baseWeight,
        currentWeight: currentWeight,
        difference: weightDiff,
        tolerance: tolerance,
      },
      location: location,
      sensorData: { weight: currentWeight },
    });

    return alert;
  }

  return null;
};

/**
 * Check seal tamper and create alert
 */
const checkSealAlert = async (tripId, deviceId, sealStatus, location) => {
  if (sealStatus === CONSTANTS.SEAL_STATUS.TAMPERED) {
    const alert = await createAlert({
      tripId: tripId,
      deviceId: deviceId,
      type: CONSTANTS.ALERT_TYPES.SEAL_TAMPERED,
      severity: CONSTANTS.ALERT_SEVERITY.CRITICAL,
      message: "Container seal has been tampered! Door opened or seal broken.",
      details: { sealStatus: sealStatus },
      location: location,
      sensorData: { sealStatus: sealStatus },
    });

    return alert;
  }

  return null;
};

/**
 * Check device detachment and create alert
 */
const checkDeviceDetachAlert = async (tripId, deviceId, deviceAttached, location) => {
  if (deviceAttached === false) {
    const alert = await createAlert({
      tripId: tripId,
      deviceId: deviceId,
      type: CONSTANTS.ALERT_TYPES.DEVICE_DETACHED,
      severity: CONSTANTS.ALERT_SEVERITY.CRITICAL,
      message: "IoT device has been detached from the container!",
      details: { deviceAttached: false },
      location: location,
    });

    return alert;
  }

  return null;
};

/**
 * Check route deviation and create alert
 */
const checkRouteDeviationAlert = async (tripId, deviceId, deviationResult, location) => {
  if (deviationResult.isDeviated) {
    const alert = await createAlert({
      tripId: tripId,
      deviceId: deviceId,
      type: CONSTANTS.ALERT_TYPES.ROUTE_DEVIATION,
      severity:
        deviationResult.deviationDistance > 1000
          ? CONSTANTS.ALERT_SEVERITY.CRITICAL
          : CONSTANTS.ALERT_SEVERITY.HIGH,
      message: `Container deviated ${deviationResult.deviationDistance}m from planned route (tolerance: ${deviationResult.toleranceMeters}m)`,
      details: {
        deviationDistance: deviationResult.deviationDistance,
        tolerance: deviationResult.toleranceMeters,
      },
      location: location,
    });

    return alert;
  }

  return null;
};

/**
 * Check low battery and create alert
 */
const checkBatteryAlert = async (tripId, deviceId, batteryLevel, location) => {
  if (batteryLevel <= CONSTANTS.THRESHOLDS.LOW_BATTERY_PERCENT) {
    const alert = await createAlert({
      tripId: tripId,
      deviceId: deviceId,
      type: CONSTANTS.ALERT_TYPES.LOW_BATTERY,
      severity: CONSTANTS.ALERT_SEVERITY.LOW,
      message: `Device battery low: ${batteryLevel}%`,
      details: { batteryLevel: batteryLevel },
      location: location,
    });

    return alert;
  }

  return null;
};

/**
 * Get alerts for a trip
 */
const getTripAlerts = async (tripId, limit = 50) => {
  try {
    const snapshot = await db
      .collection(CONSTANTS.COLLECTIONS.ALERTS)
      .where("tripId", "==", tripId)
      .orderBy("timestampMs", "desc")
      .limit(limit)
      .get();

    const alerts = [];
    snapshot.forEach((doc) => {
      alerts.push(doc.data());
    });

    return alerts;
  } catch (error) {
    logger.error("Get trip alerts failed:", error.message);
    return [];
  }
};

/**
 * Resolve an alert
 */
const resolveAlert = async (alertId, userId) => {
  try {
    await db.collection(CONSTANTS.COLLECTIONS.ALERTS).doc(alertId).update({
      resolved: true,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: userId,
    });

    // Get alert to find tripId
    const alertDoc = await db
      .collection(CONSTANTS.COLLECTIONS.ALERTS)
      .doc(alertId)
      .get();

    if (alertDoc.exists) {
      const alertData = alertDoc.data();
      // Remove from Realtime Database
      await rtdb
        .ref(
          `${CONSTANTS.RTDB_PATHS.ACTIVE_ALERTS}/${alertData.tripId}/${alertId}`
        )
        .remove();
    }

    logger.success(`Alert resolved: ${alertId}`);
    return true;
  } catch (error) {
    logger.error("Resolve alert failed:", error.message);
    return false;
  }
};

/**
 * Get all active alerts (for admin)
 */
const getAllActiveAlerts = async () => {
  try {
    const snapshot = await db
      .collection(CONSTANTS.COLLECTIONS.ALERTS)
      .where("resolved", "==", false)
      .orderBy("timestampMs", "desc")
      .get();

    const alerts = [];
    snapshot.forEach((doc) => {
      alerts.push(doc.data());
    });

    return alerts;
  } catch (error) {
    logger.error("Get active alerts failed:", error.message);
    return [];
  }
};

module.exports = {
  createAlert,
  checkWeightAlert,
  checkSealAlert,
  checkDeviceDetachAlert,
  checkRouteDeviationAlert,
  checkBatteryAlert,
  getTripAlerts,
  resolveAlert,
  getAllActiveAlerts,
};
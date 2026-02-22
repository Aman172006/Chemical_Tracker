const { rtdb, db } = require("../config/firebase");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");
const {
    broadcastTrackingUpdate,
    broadcastDeviceStatus,
} = require("../websocket/socketHandler");

// ============================================
// RTDB TELEMETRY LISTENER
// Watches telemetry/latest for ESP32 direct writes
// and bridges data to Socket.io + live/{tripId}
// ============================================

let activeTripCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30000; // re-check active trip every 30s

/**
 * Find the currently active trip from Firestore.
 * Caches result to avoid hammering Firestore on every telemetry update.
 */
const getActiveTrip = async () => {
    const now = Date.now();
    if (activeTripCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return activeTripCache;
    }

    try {
        // Look for active trips first
        let snapshot = await db
            .collection(CONSTANTS.COLLECTIONS.TRIPS)
            .where("status", "==", CONSTANTS.TRIP_STATUS.ACTIVE)
            .limit(1)
            .get();

        // If no active trip, check for "created" trips (about to start)
        if (snapshot.empty) {
            snapshot = await db
                .collection(CONSTANTS.COLLECTIONS.TRIPS)
                .where("status", "==", CONSTANTS.TRIP_STATUS.CREATED)
                .limit(1)
                .get();
        }

        // Also check "alert" status trips
        if (snapshot.empty) {
            snapshot = await db
                .collection(CONSTANTS.COLLECTIONS.TRIPS)
                .where("status", "==", CONSTANTS.TRIP_STATUS.ALERT)
                .limit(1)
                .get();
        }

        if (snapshot.empty) {
            activeTripCache = null;
            cacheTimestamp = now;
            return null;
        }

        const doc = snapshot.docs[0];
        activeTripCache = { tripId: doc.id, ...doc.data() };
        cacheTimestamp = now;
        return activeTripCache;
    } catch (err) {
        logger.error("Failed to fetch active trip:", err.message);
        return activeTripCache; // return stale cache on error
    }
};

/**
 * Invalidate the trip cache (call when trips are created/started/completed)
 */
const invalidateTripCache = () => {
    activeTripCache = null;
    cacheTimestamp = 0;
};

/**
 * Start listening to telemetry/latest in Firebase RTDB.
 * On each change:
 *  1. Lookup the active trip
 *  2. Update live/{tripId} in RTDB
 *  3. Broadcast via Socket.io
 */
const startTelemetryListener = () => {
    const telemetryRef = rtdb.ref(`${CONSTANTS.RTDB_PATHS.TELEMETRY}/latest`);

    telemetryRef.on("value", async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        logger.info(
            `📡 RTDB telemetry received: lat=${data.latitude}, lng=${data.longitude}, weight=${data.weight}`
        );

        // Find active trip
        const trip = await getActiveTrip();
        if (!trip) {
            logger.warn("⚠️  Telemetry received but no active trip found. Skipping.");
            return;
        }

        const tripId = trip.tripId;
        const currentLocation = {
            lat: parseFloat(data.latitude) || 0,
            lng: parseFloat(data.longitude) || 0,
        };
        const currentWeight = data.weight !== undefined ? parseFloat(data.weight) : null;
        const speedKmph = data.speed_kmph !== undefined ? parseFloat(data.speed_kmph) : null;
        const tamperOpen = data.tamper_open === true;
        const sealStatus = tamperOpen ? "tampered" : "intact";
        const gpsValid = data.gps_valid !== false;
        const diverted = data.diverted === true;
        const timestampMs = data.timestamp_ms || Date.now();

        // Update live/{tripId} in RTDB so REST polling also works
        try {
            await rtdb.ref(`${CONSTANTS.RTDB_PATHS.LIVE}/${tripId}`).update({
                currentLocation: {
                    lat: currentLocation.lat,
                    lng: currentLocation.lng,
                    timestamp: Date.now(),
                },
                weight: currentWeight,
                sealStatus: sealStatus,
                deviceAttached: true,
                lastUpdate: Date.now(),
                speedKmph: speedKmph,
                gpsValid: gpsValid,
                diverted: diverted,
            });
        } catch (err) {
            logger.error("Failed to update live RTDB:", err.message);
        }

        // Broadcast via Socket.io to all clients watching this trip
        broadcastTrackingUpdate(tripId, {
            location: currentLocation,
            weight: currentWeight,
            sealStatus: sealStatus,
            deviceAttached: true,
            batteryLevel: null,
            progress: null,
            distanceCovered: null,
            speed: speedKmph,
        });

        // Broadcast device status (device is alive since we got telemetry)
        broadcastDeviceStatus(tripId, true);

        logger.info(
            `✅ Telemetry bridged to trip ${tripId} | Lat: ${currentLocation.lat}, Lng: ${currentLocation.lng}`
        );
    });

    logger.success("📡 RTDB telemetry listener started on telemetry/latest");
};

/**
 * Stop listening (for graceful shutdown)
 */
const stopTelemetryListener = () => {
    const telemetryRef = rtdb.ref(`${CONSTANTS.RTDB_PATHS.TELEMETRY}/latest`);
    telemetryRef.off("value");
    logger.info("📡 RTDB telemetry listener stopped");
};

module.exports = {
    startTelemetryListener,
    stopTelemetryListener,
    invalidateTripCache,
};

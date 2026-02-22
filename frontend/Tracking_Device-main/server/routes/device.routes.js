import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
    getTripById, updateTrip, rotateSecretId,
    createAlert, getAlertsByTrip, getAllActiveAlerts, resolveAlert as resolveAlertStore,
    addTrackingPoint, getTrackingHistory
} from '../services/dataStore.js';

const router = express.Router();

/**
 * POST /api/device/data
 * Receives telemetry from device (or simulation panel).
 * Processes data, generates alerts, emits socket events.
 * Body: { deviceId, tripId, location, weight, sealStatus, deviceAttached, batteryLevel }
 */
router.post('/data', async (req, res) => {
    const { deviceId, tripId, location, weight, sealStatus, deviceAttached, batteryLevel } = req.body;

    if (!tripId) {
        return res.status(400).json({ success: false, message: 'tripId is required' });
    }

    const trip = getTripById(tripId);
    if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const io = req.app.get('io');
    const alertsGenerated = [];
    let newSecretId = null;

    // Update trip with latest data
    const updates = {
        deviceId: deviceId || trip.deviceId,
        lastLocation: location || trip.lastLocation,
        currentWeight: weight ?? trip.currentWeight,
        sealIntact: sealStatus === 'intact',
        deviceAttached: deviceAttached ?? true,
        batteryLevel: batteryLevel ?? trip.batteryLevel,
    };

    // Set base weight on first data point
    if (trip.baseWeight === null && weight != null) {
        updates.baseWeight = weight;
    }

    updateTrip(tripId, updates);

    // Store tracking point
    addTrackingPoint(tripId, {
        location,
        sensors: { weight, sealStatus, deviceAttached, batteryLevel },
    });

    // ─── ALERT DETECTION ───────────────────────────

    // 1. Route Deviation — check if location is far from planned route
    if (location && trip.plannedRoute && trip.plannedRoute.length >= 2) {
        const deviation = checkRouteDeviation(location, trip.plannedRoute);
        if (deviation > 200) { // 200 meters
            const alert = createAlert({
                tripId,
                type: 'route_deviation',
                severity: 'medium',
                message: `Route deviation detected: ${Math.round(deviation)}m off course`,
                location,
                details: { deviationDistance: deviation },
            });
            alertsGenerated.push(alert);

            io.to(`trip:${tripId}`).emit('new-alert', alert);
            io.to(`owner:${trip.ownerId}`).emit('new-alert', alert);
        }
    }

    // 2. Weight Change
    if (trip.baseWeight != null && weight != null) {
        const changePct = Math.abs(weight - trip.baseWeight) / trip.baseWeight;
        if (changePct > 0.02) { // 2% threshold
            const alert = createAlert({
                tripId,
                type: 'weight_change',
                severity: changePct > 0.10 ? 'critical' : 'high',
                message: `Weight anomaly: ${weight}kg (base: ${trip.baseWeight}kg, ${(changePct * 100).toFixed(1)}% change)`,
                location,
                details: { currentWeight: weight, baseWeight: trip.baseWeight, changePct },
            });
            alertsGenerated.push(alert);

            io.to(`trip:${tripId}`).emit('new-alert', alert);
            io.to(`owner:${trip.ownerId}`).emit('new-alert', alert);
        }
    }

    // 3. Seal Tamper
    if (sealStatus === 'tampered') {
        const alert = createAlert({
            tripId,
            type: 'seal_tamper',
            severity: 'critical',
            message: `Seal tampered on trip ${tripId}`,
            location,
        });
        alertsGenerated.push(alert);

        // Rotate secret ID on seal tamper
        newSecretId = rotateSecretId(tripId);

        io.to(`trip:${tripId}`).emit('new-alert', alert);
        io.to(`trip:${tripId}`).emit('secret-id-rotated', { tripId, reason: 'seal_tamper' });
        io.to(`owner:${trip.ownerId}`).emit('new-alert', alert);
        io.to(`owner:${trip.ownerId}`).emit('new-secret-id', { tripId, secretId: newSecretId });
    }

    // 4. Device Detached
    if (deviceAttached === false) {
        const alert = createAlert({
            tripId,
            type: 'device_detached',
            severity: 'critical',
            message: `Tracking device detached from trip ${tripId}`,
            location,
        });
        alertsGenerated.push(alert);

        // Rotate secret ID on device detach
        if (!newSecretId) {
            newSecretId = rotateSecretId(tripId);
            io.to(`trip:${tripId}`).emit('secret-id-rotated', { tripId, reason: 'device_detached' });
            io.to(`owner:${trip.ownerId}`).emit('new-secret-id', { tripId, secretId: newSecretId });
        }

        io.to(`trip:${tripId}`).emit('new-alert', alert);
        io.to(`owner:${trip.ownerId}`).emit('new-alert', alert);

        io.to(`trip:${tripId}`).emit('device-status', { tripId, deviceConnected: false });
    }

    // 5. Low Battery
    if (batteryLevel != null && batteryLevel < 15) {
        const alert = createAlert({
            tripId,
            type: 'low_battery',
            severity: 'low',
            message: `Low battery: ${batteryLevel}%`,
            location,
        });
        alertsGenerated.push(alert);

        io.to(`trip:${tripId}`).emit('new-alert', alert);
    }

    // ─── EMIT TRACKING UPDATE ─────────────────────
    const trackingUpdate = {
        tripId,
        location,
        sensors: {
            weight,
            speed: null,
            sealStatus: sealStatus || 'intact',
            deviceAttached: deviceAttached ?? true,
            batteryLevel,
        },
        progress: calculateProgress(trip),
        timestamp: Date.now(),
    };

    io.to(`trip:${tripId}`).emit('tracking-update', trackingUpdate);

    res.json({
        success: true,
        data: {
            alerts: alertsGenerated.length,
            progress: trackingUpdate.progress,
            newSecretId: newSecretId || undefined,
        },
    });
});

/**
 * GET /api/device/status/:tripId
 */
router.get('/status/:tripId', authMiddleware, async (req, res) => {
    const trip = getTripById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    res.json({
        success: true,
        data: {
            live: {
                currentLocation: trip.lastLocation,
                weight: trip.currentWeight,
                sealStatus: trip.sealIntact ? 'intact' : 'tampered',
                deviceAttached: trip.deviceAttached ?? true,
                batteryLevel: trip.batteryLevel ?? null,
                progress: trip.progress || 0,
                distanceCovered: 0,
                lastUpdate: trip.updatedAt,
            },
        },
    });
});

/**
 * GET /api/device/alerts/:tripId
 */
router.get('/alerts/:tripId', authMiddleware, async (req, res) => {
    const alerts = getAlertsByTrip(req.params.tripId);
    res.json({ success: true, data: { alerts } });
});

/**
 * GET /api/device/alerts/all/active
 */
router.get('/alerts/all/active', authMiddleware, async (req, res) => {
    const alerts = getAllActiveAlerts();
    res.json({ success: true, data: { alerts } });
});

/**
 * PUT /api/device/alerts/:alertId/resolve
 */
router.put('/alerts/:alertId/resolve', authMiddleware, async (req, res) => {
    const alert = resolveAlertStore(req.params.alertId);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: { alert } });
});

/**
 * GET /api/device/tracking/:tripId
 */
router.get('/tracking/:tripId', authMiddleware, async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const tracking = getTrackingHistory(req.params.tripId, limit);
    res.json({ success: true, data: { tracking } });
});

// ── HELPERS ──────────────────────────────────────

function checkRouteDeviation(currentLoc, route) {
    if (!route || route.length < 2) return 0;

    let minDist = Infinity;
    for (const point of route) {
        const d = haversineDistance(currentLoc.lat, currentLoc.lng, point.lat, point.lng);
        if (d < minDist) minDist = d;
    }
    return minDist;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // meters
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateProgress(trip) {
    if (!trip.startLocation || !trip.endLocation || !trip.lastLocation) return 0;
    const totalDist = haversineDistance(
        trip.startLocation.lat, trip.startLocation.lng,
        trip.endLocation.lat, trip.endLocation.lng
    );
    if (totalDist === 0) return 0;
    const covered = haversineDistance(
        trip.startLocation.lat, trip.startLocation.lng,
        trip.lastLocation.lat, trip.lastLocation.lng
    );
    return Math.min(100, Math.round((covered / totalDist) * 100));
}

export default router;

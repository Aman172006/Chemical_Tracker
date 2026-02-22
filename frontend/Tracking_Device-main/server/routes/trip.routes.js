import express from 'express';
import { authMiddleware, ownerOnly } from '../middleware/authMiddleware.js';
import {
    createTrip, getTripsByOwner, getTripById, getTripBySecretId,
    updateTrip, rotateSecretId, getAllTrips
} from '../services/dataStore.js';

const router = express.Router();

/**
 * POST /api/trip/create
 */
router.post('/create', authMiddleware, ownerOnly, async (req, res) => {
    try {
        const { trip, secretId } = createTrip({ ...req.body, ownerId: req.user.userId });

        // Emit new-secret-id to owner room
        const io = req.app.get('io');
        io.to(`owner:${req.user.userId}`).emit('new-secret-id', {
            tripId: trip.tripId,
            secretId,
        });

        res.status(201).json({
            success: true,
            data: {
                trip,
                tripId: trip.tripId,
                containerId: trip.containerId,
                secretId,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/trip/list
 */
router.get('/list', authMiddleware, async (req, res) => {
    const trips = req.user.role === 'admin'
        ? getAllTrips()
        : getTripsByOwner(req.user.userId);

    res.json({
        success: true,
        data: { trips },
    });
});

/**
 * GET /api/trip/:tripId
 */
router.get('/:tripId', authMiddleware, async (req, res) => {
    const trip = getTripById(req.params.tripId);
    if (!trip) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.json({ success: true, data: { trip } });
});

/**
 * PUT /api/trip/:tripId/start
 */
router.put('/:tripId/start', authMiddleware, ownerOnly, async (req, res) => {
    const trip = updateTrip(req.params.tripId, { status: 'active' });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const io = req.app.get('io');
    io.to(`trip:${trip.tripId}`).emit('trip-status-changed', {
        tripId: trip.tripId,
        status: 'active',
    });

    res.json({ success: true, data: { trip } });
});

/**
 * PUT /api/trip/:tripId/complete
 */
router.put('/:tripId/complete', authMiddleware, ownerOnly, async (req, res) => {
    const trip = updateTrip(req.params.tripId, { status: 'completed' });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const io = req.app.get('io');
    io.to(`trip:${trip.tripId}`).emit('trip-status-changed', {
        tripId: trip.tripId,
        status: 'completed',
    });

    res.json({ success: true, data: { trip } });
});

/**
 * PUT /api/trip/:tripId/cancel
 */
router.put('/:tripId/cancel', authMiddleware, ownerOnly, async (req, res) => {
    const trip = updateTrip(req.params.tripId, { status: 'cancelled' });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const io = req.app.get('io');
    io.to(`trip:${trip.tripId}`).emit('trip-status-changed', {
        tripId: trip.tripId,
        status: 'cancelled',
    });

    res.json({ success: true, data: { trip } });
});

/**
 * GET /api/trip/:tripId/secret-ids
 */
router.get('/:tripId/secret-ids', authMiddleware, ownerOnly, async (req, res) => {
    const trip = getTripById(req.params.tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    res.json({
        success: true,
        data: {
            currentSecretId: trip.currentSecretId,
            history: trip.secretIdHistory,
        },
    });
});

/**
 * POST /api/trip/validate-secret-id
 * Public endpoint — validates a secretId and returns trip info
 * Body: { secretId }
 */
router.post('/validate-secret-id', async (req, res) => {
    const { secretId } = req.body;

    if (!secretId) {
        return res.status(400).json({ success: false, message: 'Secret ID is required' });
    }

    const trip = getTripBySecretId(secretId);
    if (!trip) {
        return res.status(404).json({ success: false, message: 'Invalid or expired Secret ID' });
    }

    res.json({
        success: true,
        data: {
            tripId: trip.tripId,
            chemicalName: trip.chemicalName,
            startLocation: trip.startLocation,
            endLocation: trip.endLocation,
            status: trip.status,
        },
    });
});

/**
 * POST /api/trip/live
 * Public — get live data for a secret ID
 * Body: { secretId }
 */
router.post('/live', async (req, res) => {
    const { secretId } = req.body;
    const trip = getTripBySecretId(secretId);
    if (!trip) {
        return res.status(404).json({ success: false, message: 'Invalid Secret ID' });
    }

    res.json({
        success: true,
        data: {
            tripId: trip.tripId,
            liveData: {
                weight: trip.currentWeight,
                currentLocation: trip.lastLocation,
                sealStatus: trip.sealIntact ? 'intact' : 'tampered',
                deviceAttached: trip.deviceAttached ?? true,
                progress: trip.progress || 0,
                batteryLevel: trip.batteryLevel || null,
            },
        },
    });
});

export default router;

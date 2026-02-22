/**
 * In-Memory Data Store
 * For hackathon demo — no database needed.
 * All data lives in memory and resets on restart.
 */
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

// ── USERS ─────────────────────────────────────
const users = new Map();

// Seed a demo owner
const DEMO_OWNER_ID = uuidv4();
users.set(DEMO_OWNER_ID, {
    userId: DEMO_OWNER_ID,
    email: 'owner@chemtrack.com',
    // bcrypt hash of "password123"
    passwordHash: '$2a$10$placeholder', // Will be set on first register
    name: 'ChemTrack Owner',
    phone: '+919876543210',
    role: 'owner',
    createdAt: Date.now(),
});

export function getUserByEmail(email) {
    for (const [, u] of users) {
        if (u.email === email) return u;
    }
    return null;
}

export function getUserById(id) {
    return users.get(id) || null;
}

export function createUser({ email, passwordHash, name, phone, role }) {
    const userId = uuidv4();
    const user = { userId, email, passwordHash, name, phone, role, createdAt: Date.now() };
    users.set(userId, user);
    return user;
}

export function getAllUsers() {
    return [...users.values()].map(u => ({
        userId: u.userId, email: u.email, name: u.name, role: u.role
    }));
}

// ── TRIPS ─────────────────────────────────────
const trips = new Map();

export function createTrip(data) {
    const tripId = `TRIP-${nanoid(8).toUpperCase()}`;
    const containerId = `CNT-${nanoid(6).toUpperCase()}`;
    const secretId = nanoid(12).toUpperCase();

    const trip = {
        tripId,
        containerId,
        ownerId: data.ownerId,
        status: 'created', // created | active | completed | cancelled
        chemicalName: data.chemicalName || null,
        chemicalQuantity: data.chemicalQuantity || null,
        startLocation: data.startLocation || null,
        endLocation: data.endLocation || null,
        plannedRoute: data.plannedRoute || [],
        receiverEmail: data.receiverEmail || null,
        receiverPhone: data.receiverPhone || null,
        notes: data.notes || null,
        currentSecretId: secretId,
        secretIdHistory: [{ secretId, createdAt: Date.now() }],
        baseWeight: null,
        currentWeight: null,
        lastLocation: null,
        deviceId: null,
        totalAlerts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    trips.set(tripId, trip);
    return { trip, secretId };
}

export function getTripsByOwner(ownerId) {
    return [...trips.values()].filter(t => t.ownerId === ownerId);
}

export function getTripById(tripId) {
    return trips.get(tripId) || null;
}

export function getTripBySecretId(secretId) {
    for (const [, t] of trips) {
        if (t.currentSecretId === secretId) return t;
    }
    return null;
}

export function updateTrip(tripId, data) {
    const trip = trips.get(tripId);
    if (!trip) return null;
    Object.assign(trip, data, { updatedAt: Date.now() });
    return trip;
}

export function rotateSecretId(tripId) {
    const trip = trips.get(tripId);
    if (!trip) return null;
    const newSecretId = nanoid(12).toUpperCase();
    trip.currentSecretId = newSecretId;
    trip.secretIdHistory.push({ secretId: newSecretId, createdAt: Date.now() });
    trip.updatedAt = Date.now();
    return newSecretId;
}

export function getAllTrips() {
    return [...trips.values()];
}

// ── ALERTS ────────────────────────────────────
const alerts = new Map();

export function createAlert(data) {
    const alertId = `ALT-${nanoid(8).toUpperCase()}`;
    const alert = {
        alertId,
        tripId: data.tripId,
        type: data.type,
        severity: data.severity || 'low',
        message: data.message,
        location: data.location || null,
        details: data.details || null,
        resolved: false,
        timestamp: Date.now(),
    };
    alerts.set(alertId, alert);

    // Increment trip alert count
    const trip = trips.get(data.tripId);
    if (trip) trip.totalAlerts = (trip.totalAlerts || 0) + 1;

    return alert;
}

export function getAlertsByTrip(tripId) {
    return [...alerts.values()].filter(a => a.tripId === tripId);
}

export function getAllActiveAlerts() {
    return [...alerts.values()].filter(a => !a.resolved);
}

export function resolveAlert(alertId) {
    const alert = alerts.get(alertId);
    if (!alert) return null;
    alert.resolved = true;
    return alert;
}

// ── TRACKING HISTORY ──────────────────────────
const trackingHistory = new Map(); // tripId → [{ location, sensors, timestamp }]

export function addTrackingPoint(tripId, data) {
    if (!trackingHistory.has(tripId)) trackingHistory.set(tripId, []);
    const points = trackingHistory.get(tripId);
    points.push({
        location: data.location,
        sensors: data.sensors || {},
        timestamp: Date.now(),
    });
    // Keep last 500 points per trip
    if (points.length > 500) points.shift();
}

export function getTrackingHistory(tripId, limit = 100) {
    const points = trackingHistory.get(tripId) || [];
    return points.slice(-limit);
}

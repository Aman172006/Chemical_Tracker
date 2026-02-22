const logger = require("../utils/logger");

// ============================================
// STORE IO INSTANCE GLOBALLY
// ============================================
let ioInstance = null;

// ============================================
// INITIALIZE SOCKET.IO
// ============================================
const initializeSocket = (server) => {
    const { Server } = require("socket.io");

    const io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL || "http://localhost:3000",
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
        // Reconnection settings
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // Store globally so other files can use it
    ioInstance = io;

    // ============================================
    // CONNECTION HANDLER
    // ============================================
    io.on("connection", (socket) => {
        logger.info(
            `🔌 Client connected: ${socket.id} | IP: ${socket.handshake.address}`
        );

        // ---- JOIN TRIP ROOM ----
        // Frontend sends this when user opens a trip tracking page
        // This way we only send data to clients watching that specific trip
        socket.on("join-trip", (tripId) => {
            if (!tripId) {
                socket.emit("error", { message: "tripId is required" });
                return;
            }

            socket.join(tripId);
            logger.info(
                `📍 Client ${socket.id} joined trip room: ${tripId}`
            );

            // Confirm to client
            socket.emit("joined-trip", {
                tripId: tripId,
                message: `Now receiving live updates for trip ${tripId}`,
                socketId: socket.id,
            });
        });

        // ---- LEAVE TRIP ROOM ----
        socket.on("leave-trip", (tripId) => {
            if (!tripId) return;

            socket.leave(tripId);
            logger.info(
                `📍 Client ${socket.id} left trip room: ${tripId}`
            );

            socket.emit("left-trip", {
                tripId: tripId,
                message: `Stopped receiving updates for trip ${tripId}`,
            });
        });

        // ---- JOIN OWNER ROOM ----
        // Owner joins their personal room to receive secret ID updates
        socket.on("join-owner-room", (ownerId) => {
            if (!ownerId) return;

            const ownerRoom = `owner_${ownerId}`;
            socket.join(ownerRoom);
            logger.info(
                `👤 Owner ${socket.id} joined owner room: ${ownerRoom}`
            );

            socket.emit("joined-owner-room", {
                ownerId: ownerId,
                message: "Now receiving owner-specific updates",
            });
        });

        // ---- JOIN ADMIN ROOM ----
        // Admin joins to receive all alerts across all trips
        socket.on("join-admin-room", () => {
            socket.join("admin_room");
            logger.info(`🛡️ Admin ${socket.id} joined admin room`);

            socket.emit("joined-admin-room", {
                message: "Now receiving all system alerts",
            });
        });

        // ---- PING/PONG (Keep alive check) ----
        socket.on("ping-server", () => {
            socket.emit("pong-server", {
                timestamp: Date.now(),
                socketId: socket.id,
            });
        });

        // ---- DISCONNECT ----
        socket.on("disconnect", (reason) => {
            logger.info(
                `🔌 Client disconnected: ${socket.id} | Reason: ${reason}`
            );
        });

        // ---- ERROR ----
        socket.on("error", (error) => {
            logger.error(`Socket error for ${socket.id}:`, error.message);
        });
    });

    logger.success("Socket.io initialized successfully");
    logger.info(`📡 WebSocket server ready for connections`);

    return io;
};

// ============================================
// BROADCAST FUNCTIONS
// (Called from controllers when data arrives)
// ============================================

/**
 * Send live tracking data to all clients watching a specific trip
 * Called every time ESP32 sends sensor data
 */
const broadcastTrackingUpdate = (tripId, data) => {
    if (!ioInstance) {
        logger.warn("Socket.io not initialized. Cannot broadcast.");
        return;
    }

    ioInstance.to(tripId).emit("tracking-update", {
        tripId: tripId,
        timestamp: Date.now(),
        location: data.location,
        sensors: {
            weight: data.weight,
            sealStatus: data.sealStatus,
            deviceAttached: data.deviceAttached,
            batteryLevel: data.batteryLevel,
        },
        progress: data.progress,
        distanceCovered: data.distanceCovered,
    });
};

/**
 * Send alert to trip room + owner room + admin room
 * Called when any alert is generated
 */
const broadcastAlert = (tripId, ownerId, alert) => {
    if (!ioInstance) {
        logger.warn("Socket.io not initialized. Cannot broadcast alert.");
        return;
    }

    const alertData = {
        tripId: tripId,
        alertId: alert.alertId,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        location: alert.location,
        timestamp: Date.now(),
    };

    // Send to everyone watching this trip
    ioInstance.to(tripId).emit("new-alert", alertData);

    // Send to owner's personal room
    if (ownerId) {
        ioInstance.to(`owner_${ownerId}`).emit("new-alert", alertData);
    }

    // Send to admin room
    ioInstance.to("admin_room").emit("new-alert", alertData);

    logger.alert(
        alert.type,
        `Broadcasted to trip ${tripId} | ${alert.message}`
    );
};

/**
 * Send new secret ID ONLY to the owner
 * Receiver should NOT get this — they must ask owner
 */
const broadcastNewSecretId = (tripId, ownerId, secretIdData) => {
    if (!ioInstance) {
        logger.warn("Socket.io not initialized. Cannot broadcast secret ID.");
        return;
    }

    // ONLY send to owner's room (NOT to trip room)
    if (ownerId) {
        ioInstance.to(`owner_${ownerId}`).emit("new-secret-id", {
            tripId: tripId,
            secretId: secretIdData.secretId,
            generatedAt: secretIdData.generatedAt,
            location: secretIdData.location,
            message: "New Secret ID generated. Share with receiver manually.",
        });
    }

    // Also notify trip room that ID changed (but don't send the actual ID)
    ioInstance.to(tripId).emit("secret-id-rotated", {
        tripId: tripId,
        message: "Secret ID has been rotated. Previous ID is now expired.",
        timestamp: Date.now(),
    });
};

/**
 * Notify that trip status changed
 */
const broadcastTripStatusChange = (tripId, status) => {
    if (!ioInstance) return;

    ioInstance.to(tripId).emit("trip-status-changed", {
        tripId: tripId,
        status: status,
        timestamp: Date.now(),
    });

    ioInstance.to("admin_room").emit("trip-status-changed", {
        tripId: tripId,
        status: status,
        timestamp: Date.now(),
    });
};

/**
 * Notify device connection/disconnection
 */
const broadcastDeviceStatus = (tripId, isConnected) => {
    if (!ioInstance) return;

    ioInstance.to(tripId).emit("device-status", {
        tripId: tripId,
        deviceConnected: isConnected,
        timestamp: Date.now(),
    });
};

/**
 * Get count of connected clients (for monitoring)
 */
const getConnectedClients = () => {
    if (!ioInstance) return 0;
    return ioInstance.engine.clientsCount;
};

/**
 * Get clients in a specific trip room
 */
const getClientsInRoom = async (tripId) => {
    if (!ioInstance) return 0;
    const sockets = await ioInstance.in(tripId).fetchSockets();
    return sockets.length;
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
    initializeSocket,
    broadcastTrackingUpdate,
    broadcastAlert,
    broadcastNewSecretId,
    broadcastTripStatusChange,
    broadcastDeviceStatus,
    getConnectedClients,
    getClientsInRoom,
};
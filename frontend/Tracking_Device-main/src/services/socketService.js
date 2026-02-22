import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const socketService = {
    // Connect to server
    connect: () => {
        if (socket && socket.connected) return socket;

        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });

        return socket;
    },

    // Disconnect
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    // Get socket instance
    getSocket: () => socket,

    // Is connected?
    isConnected: () => socket?.connected || false,

    // ── EMIT: Frontend → Backend ──────────────────────────

    joinTrip: (tripId) => {
        if (socket) socket.emit('join-trip', tripId);
    },

    leaveTrip: (tripId) => {
        if (socket) socket.emit('leave-trip', tripId);
    },

    joinOwnerRoom: (ownerId) => {
        if (socket) socket.emit('join-owner-room', ownerId);
    },

    joinAdminRoom: () => {
        if (socket) socket.emit('join-admin-room');
    },

    pingServer: () => {
        if (socket) socket.emit('ping-server');
    },

    // ── LISTEN: Backend → Frontend ────────────────────────

    onTrackingUpdate: (callback) => {
        if (socket) socket.on('tracking-update', callback);
    },

    offTrackingUpdate: (callback) => {
        if (socket) socket.off('tracking-update', callback);
    },

    onAlert: (callback) => {
        if (socket) socket.on('new-alert', callback);
    },

    offAlert: (callback) => {
        if (socket) socket.off('new-alert', callback);
    },

    onNewSecretId: (callback) => {
        if (socket) socket.on('new-secret-id', callback);
    },

    offNewSecretId: (callback) => {
        if (socket) socket.off('new-secret-id', callback);
    },

    onSecretIdRotated: (callback) => {
        if (socket) socket.on('secret-id-rotated', callback);
    },

    offSecretIdRotated: (callback) => {
        if (socket) socket.off('secret-id-rotated', callback);
    },

    onTripStatusChanged: (callback) => {
        if (socket) socket.on('trip-status-changed', callback);
    },

    offTripStatusChanged: (callback) => {
        if (socket) socket.off('trip-status-changed', callback);
    },

    onDeviceStatus: (callback) => {
        if (socket) socket.on('device-status', callback);
    },

    offDeviceStatus: (callback) => {
        if (socket) socket.off('device-status', callback);
    },

    // Joined confirmations
    onJoinedTrip: (callback) => {
        if (socket) socket.on('joined-trip', callback);
    },

    onJoinedOwnerRoom: (callback) => {
        if (socket) socket.on('joined-owner-room', callback);
    },

    onJoinedAdminRoom: (callback) => {
        if (socket) socket.on('joined-admin-room', callback);
    },

    // Remove all listeners (cleanup)
    removeAllListeners: () => {
        if (socket) {
            socket.off('tracking-update');
            socket.off('new-alert');
            socket.off('new-secret-id');
            socket.off('secret-id-rotated');
            socket.off('trip-status-changed');
            socket.off('device-status');
            socket.off('joined-trip');
            socket.off('joined-owner-room');
            socket.off('joined-admin-room');
            socket.off('pong-server');
        }
    },
};

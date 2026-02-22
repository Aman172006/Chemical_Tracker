import api from './api';

export const deviceService = {
    getStatus: (tripId) => api.get(`/device/status/${tripId}`),
    getAlerts: (tripId) => api.get(`/device/alerts/${tripId}`),
    resolveAlert: (alertId) => api.put(`/device/alerts/${alertId}/resolve`),
    getAllActiveAlerts: () => api.get('/device/alerts/all/active'),
    getTrackingHistory: (tripId, limit = 100) =>
        api.get(`/device/tracking/${tripId}?limit=${limit}`),
};

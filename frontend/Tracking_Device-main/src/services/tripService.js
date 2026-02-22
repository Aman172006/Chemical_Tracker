import api from './api';

export const tripService = {
    create: (data) => api.post('/trip/create', data),
    getAll: () => api.get('/trip/list'),
    getById: (tripId) => api.get(`/trip/${tripId}`),
    start: (tripId) => api.put(`/trip/${tripId}/start`),
    complete: (tripId) => api.put(`/trip/${tripId}/complete`),
    cancel: (tripId) => api.put(`/trip/${tripId}/cancel`),
    getSecretIds: (tripId) => api.get(`/trip/${tripId}/secret-ids`),
    validateSecretId: (secretId) => api.post('/trip/validate-secret-id', { secretId }),
    getLiveData: (secretId) => api.post('/trip/live', { secretId }),
};

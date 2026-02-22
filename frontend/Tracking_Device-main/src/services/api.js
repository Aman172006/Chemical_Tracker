import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Note: Authorization header is set dynamically by AuthContext
// using Firebase ID token (auto-refreshes)

// Handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token may be expired — Firebase will auto-refresh on next request
            // Only redirect if user is truly logged out
            const user = localStorage.getItem('user');
            if (!user) {
                window.location.href = '/owner-login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

import { useState, useEffect, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import { socketService } from '../services/socketService';

/**
 * useLocationHistory — Fetches tracking history via REST API,
 * listens for real-time tracking-update socket events to append new points.
 * Replaces the old Firebase RTDB location history listener.
 */
export function useLocationHistory(tripId) {
    const [pathPoints, setPathPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch initial history from REST
    useEffect(() => {
        if (!tripId) {
            setPathPoints([]);
            return;
        }

        setLoading(true);
        deviceService.getTrackingHistory(tripId, 100)
            .then(res => {
                const tracking = res.data.data.tracking || [];
                const points = tracking
                    .filter(t => t.location?.lat && t.location?.lng)
                    .map(t => [t.location.lat, t.location.lng]);
                setPathPoints(points);
            })
            .catch(() => setPathPoints([]))
            .finally(() => setLoading(false));
    }, [tripId]);

    // Append new points from socket updates
    useEffect(() => {
        const handleUpdate = (data) => {
            if (!data || data.tripId !== tripId) return;
            if (data.location?.lat && data.location?.lng) {
                setPathPoints(prev => [...prev, [data.location.lat, data.location.lng]]);
            }
        };

        socketService.onTrackingUpdate(handleUpdate);
        return () => socketService.offTrackingUpdate(handleUpdate);
    }, [tripId]);

    return { pathPoints, loading };
}

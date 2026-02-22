/**
 * useRouteDeviation — Now a PASSIVE hook.
 * 
 * The backend handles route deviation detection and sends alerts
 * via the socket `new-alert` event with type 'route_deviation'.
 * 
 * This hook simply tracks deviation state from socket alerts
 * so the UI can show the deviation popup on the map.
 */
import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socketService';

export function useRouteDeviation(tripId) {
    const [isDeviated, setIsDeviated] = useState(false);
    const [deviationDistance, setDeviationDistance] = useState(0);
    const [deviationLocation, setDeviationLocation] = useState(null);

    useEffect(() => {
        if (!tripId) return;

        const handleAlert = (data) => {
            if (data.tripId !== tripId) return;
            if (data.type === 'route_deviation') {
                setIsDeviated(true);
                setDeviationDistance(data.details?.deviationDistance || 0);
                setDeviationLocation(data.location || null);
            }
        };

        socketService.onAlert(handleAlert);
        return () => socketService.offAlert(handleAlert);
    }, [tripId]);

    const clearDeviation = useCallback(() => {
        setIsDeviated(false);
        setDeviationDistance(0);
        setDeviationLocation(null);
    }, []);

    return {
        isDeviated,
        deviationDistance,
        deviationLocation,
        clearDeviation,
    };
}

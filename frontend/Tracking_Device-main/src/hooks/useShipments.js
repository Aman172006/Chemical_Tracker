import { useState, useEffect, useCallback } from 'react';
import { tripService } from '../services/tripService';

/**
 * useShipments — Fetches trips from the backend REST API
 * Replaces the old Firestore onSnapshot listener.
 */
export function useShipments() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Fetch trips on mount
    const fetchTrips = useCallback(async () => {
        setLoading(true);
        try {
            const res = await tripService.getAll();
            const trips = res.data.data.trips || [];
            setShipments(trips);
            // Auto-select first active trip
            if (!selectedId && trips.length > 0) {
                const active = trips.find(t => t.status === 'active') || trips[0];
                setSelectedId(active.tripId);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load trips');
        } finally {
            setLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        fetchTrips();
    }, []);

    // Create a new trip
    const createShipment = useCallback(async (data) => {
        const res = await tripService.create(data);
        const newTrip = res.data.data.trip;
        setShipments(prev => [newTrip, ...prev]);
        setSelectedId(newTrip.tripId);
        return res.data.data; // includes tripId, containerId, secretId
    }, []);

    // Start a trip
    const startTrip = useCallback(async (tripId) => {
        await tripService.start(tripId);
        setShipments(prev => prev.map(t =>
            t.tripId === tripId ? { ...t, status: 'active' } : t
        ));
    }, []);

    // Complete a trip
    const completeTrip = useCallback(async (tripId) => {
        await tripService.complete(tripId);
        setShipments(prev => prev.map(t =>
            t.tripId === tripId ? { ...t, status: 'completed' } : t
        ));
    }, []);

    // Cancel a trip
    const cancelTrip = useCallback(async (tripId) => {
        await tripService.cancel(tripId);
        setShipments(prev => prev.map(t =>
            t.tripId === tripId ? { ...t, status: 'cancelled' } : t
        ));
    }, []);

    // Refresh trips from backend
    const refreshTrips = useCallback(() => fetchTrips(), [fetchTrips]);

    // Selected shipment
    const selectedShipment = shipments.find(s => s.tripId === selectedId) || null;

    return {
        shipments,
        loading,
        error,
        selectedId,
        setSelectedId,
        selectedShipment,
        createShipment,
        startTrip,
        completeTrip,
        cancelTrip,
        refreshTrips,
    };
}

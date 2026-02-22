import { useState, useEffect, useCallback } from 'react';
import { deviceService } from '../services/deviceService';
import { socketService } from '../services/socketService';

/**
 * Map backend severity → UI threat level
 */
function severityToLevel(severity) {
    switch (severity) {
        case 'low':
        case 'medium': return 1;
        case 'high': return 2;
        case 'critical': return 3;
        default: return 1;
    }
}

/**
 * useAlerts — Fetches initial alerts via REST, listens for socket new-alert events
 * Replaces Firestore onSnapshot alert listener.
 */
export function useAlerts(tripId) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch alerts from backend API
    const fetchAlerts = useCallback(async () => {
        if (!tripId) return;
        setLoading(true);
        try {
            const res = await deviceService.getAlerts(tripId);
            const backendAlerts = res.data.data.alerts || [];
            const mapped = backendAlerts.map(a => ({
                id: a.alertId,
                alertId: a.alertId,
                tripId: a.tripId,
                type: a.type,
                severity: a.severity,
                threatLevel: severityToLevel(a.severity),
                message: a.message,
                location: a.location,
                timestamp: a.timestampMs || (a.timestamp?._seconds * 1000),
                acknowledged: a.resolved,
                resolved: a.resolved,
                details: a.details,
            }));
            setAlerts(mapped);
        } catch (err) {
            console.error('Failed to load alerts:', err);
        } finally {
            setLoading(false);
        }
    }, [tripId]);

    // Fetch on mount / tripId change
    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    // Listen for new alerts via socket
    useEffect(() => {
        const handleNewAlert = (data) => {
            if (data.tripId !== tripId) return;
            const mapped = {
                id: data.alertId,
                alertId: data.alertId,
                tripId: data.tripId,
                type: data.type,
                severity: data.severity,
                threatLevel: severityToLevel(data.severity),
                message: data.message,
                location: data.location,
                timestamp: data.timestamp,
                acknowledged: false,
                resolved: false,
            };
            setAlerts(prev => [mapped, ...prev]);
        };

        socketService.onAlert(handleNewAlert);
        return () => socketService.offAlert(handleNewAlert);
    }, [tripId]);

    // Resolve alert
    const acknowledgeAlert = useCallback(async (alertId) => {
        try {
            await deviceService.resolveAlert(alertId);
            setAlerts(prev =>
                prev.map(a => a.alertId === alertId ? { ...a, acknowledged: true, resolved: true } : a)
            );
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    }, []);

    return {
        alerts,
        loading,
        acknowledgeAlert,
        refreshAlerts: fetchAlerts,
    };
}

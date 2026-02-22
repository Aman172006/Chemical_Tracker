import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import { deviceService } from '../services/deviceService';
import { playAlertSound } from '../utils/alertSounds';

const AlertContext = createContext(null);

/**
 * Map backend severity → UI threat level
 * low/medium → 1, high → 2, critical → 3
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

export function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const lastSoundRef = useRef(0);

    // Socket listener for new-alert events
    useEffect(() => {
        const handleNewAlert = (data) => {
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

            // Play alert sound (throttled to 2s)
            if (soundEnabled && Date.now() - lastSoundRef.current > 2000) {
                lastSoundRef.current = Date.now();
                playAlertSound(mapped.threatLevel);
            }
        };

        socketService.onAlert(handleNewAlert);
        return () => socketService.offAlert(handleNewAlert);
    }, [soundEnabled]);

    // Load initial alerts for a trip
    const loadAlerts = useCallback(async (tripId) => {
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
        }
    }, []);

    // Resolve / acknowledge alert via API
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

    // Derived lists
    const unresolvedAlerts = alerts.filter(a => !a.resolved);
    const level1Alerts = unresolvedAlerts.filter(a => a.threatLevel === 1);
    const level2Alerts = unresolvedAlerts.filter(a => a.threatLevel === 2);
    const level3Alerts = unresolvedAlerts.filter(a => a.threatLevel === 3);
    const hasLevel3 = level3Alerts.length > 0;

    const value = {
        alerts,
        unresolvedAlerts,
        level1Alerts,
        level2Alerts,
        level3Alerts,
        hasLevel3,
        loadAlerts,
        acknowledgeAlert,
        soundEnabled,
        setSoundEnabled,
    };

    return (
        <AlertContext.Provider value={value}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlertContext() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlertContext must be used within AlertProvider');
    return ctx;
}

export default AlertContext;

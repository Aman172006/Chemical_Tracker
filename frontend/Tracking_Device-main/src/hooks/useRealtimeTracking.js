import { useState, useEffect, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import { socketService } from '../services/socketService';
import { deviceService } from '../services/deviceService';
import { GPS_STALE_WARNING, GPS_STALE_CRITICAL } from '../utils/constants';

/**
 * useRealtimeTracking — Dual-source real-time tracking
 *
 * Source 1: Socket.io `tracking-update` + `device-status` events (from backend)
 * Source 2: Firebase RTDB `telemetry/latest` direct listener (fallback)
 *
 * Whichever source fires, the UI updates immediately.
 */
export function useRealtimeTracking(tripId) {
    const [trackingData, setTrackingData] = useState({
        lat: null,
        lng: null,
        speed: null,
        weightKg: null,
        sealIntact: true,
        deviceAttached: true,
        batteryLevel: null,
        progress: 0,
        distanceCovered: 0,
        lastUpdated: null,
        timestamp: null,
    });
    const [lastUpdatedAgo, setLastUpdatedAgo] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('lost'); // live | delayed | lost
    const [deviceConnected, setDeviceConnected] = useState(true);

    // Handle tracking-update events from Socket.io
    const handleTrackingUpdate = useCallback((data) => {
        if (!data || data.tripId !== tripId) return;

        setTrackingData({
            lat: data.location?.lat ?? null,
            lng: data.location?.lng ?? null,
            speed: data.sensors?.speed ?? null,
            weightKg: data.sensors?.weight ?? null,
            sealIntact: data.sensors?.sealStatus === 'intact',
            deviceAttached: data.sensors?.deviceAttached ?? true,
            batteryLevel: data.sensors?.batteryLevel ?? null,
            progress: data.progress ?? 0,
            distanceCovered: data.distanceCovered ?? 0,
            lastUpdated: data.timestamp ?? Date.now(),
            timestamp: data.timestamp ?? null,
        });
    }, [tripId]);

    // Handle device-status events from Socket.io
    const handleDeviceStatus = useCallback((data) => {
        if (!data || data.tripId !== tripId) return;
        setDeviceConnected(data.deviceConnected);
    }, [tripId]);

    // Source 1: Subscribe to Socket.io events
    useEffect(() => {
        if (!tripId) return;

        socketService.onTrackingUpdate(handleTrackingUpdate);
        socketService.onDeviceStatus(handleDeviceStatus);

        // Fetch initial status via REST (only used if no RTDB data has arrived)
        deviceService.getStatus(tripId)
            .then(res => {
                const live = res.data.data.live;
                if (live) {
                    const restTimestamp = live.lastUpdate ?? 0;
                    // Use functional update to avoid overwriting newer RTDB data
                    setTrackingData(prev => {
                        // If RTDB listener already gave us newer data, skip REST
                        if (prev.lastUpdated && prev.lastUpdated > restTimestamp) {
                            console.log('[REST] Skipping REST data — RTDB data is newer');
                            return prev;
                        }
                        console.log('[REST] Using REST initial data');
                        return {
                            lat: live.currentLocation?.lat ?? null,
                            lng: live.currentLocation?.lng ?? null,
                            speed: live.speedKmph ?? null,
                            weightKg: live.weight ?? null,
                            sealIntact: live.sealStatus === 'intact',
                            deviceAttached: live.deviceAttached ?? true,
                            batteryLevel: live.batteryLevel ?? null,
                            progress: live.progress ?? 0,
                            distanceCovered: live.distanceCovered ?? 0,
                            lastUpdated: restTimestamp || Date.now(),
                            timestamp: restTimestamp || null,
                        };
                    });
                }
            })
            .catch(() => { /* silent – device may not be registered yet */ });

        return () => {
            socketService.offTrackingUpdate(handleTrackingUpdate);
            socketService.offDeviceStatus(handleDeviceStatus);
        };
    }, [tripId, handleTrackingUpdate, handleDeviceStatus]);

    // Source 2: Direct Firebase RTDB listener on telemetry/latest
    // This is the fallback that reads ESP32 data directly from RTDB
    useEffect(() => {
        console.log('[RTDB] Setting up telemetry listener. database:', !!database);
        if (!database) {
            console.warn('[RTDB] No database instance available!');
            return;
        }

        const telemetryRef = ref(database, 'telemetry/latest');
        console.log('[RTDB] Listening to telemetry/latest...');

        const unsubscribe = onValue(telemetryRef, (snapshot) => {
            const data = snapshot.val();
            console.log('[RTDB] telemetry/latest data received:', data);
            if (!data) return;

            const lat = parseFloat(data.latitude) || null;
            const lng = parseFloat(data.longitude) || null;

            console.log('[RTDB] Parsed coords:', { lat, lng });

            // Only update if we have valid coordinates
            if (lat && lng) {
                setTrackingData(prev => ({
                    ...prev,
                    lat,
                    lng,
                    speed: data.speed_kmph !== undefined ? parseFloat(data.speed_kmph) : prev.speed,
                    weightKg: data.weight !== undefined ? parseFloat(data.weight) : prev.weightKg,
                    sealIntact: data.tamper_open === true ? false : prev.sealIntact,
                    deviceAttached: true,
                    lastUpdated: Date.now(),
                    timestamp: data.timestamp_ms || Date.now(),
                }));
                setDeviceConnected(true);
                console.log('[RTDB] UI state updated with new telemetry');
            }
        }, (error) => {
            console.error('[RTDB] Listener error:', error);
        });

        return () => {
            console.log('[RTDB] Cleaning up telemetry listener');
            unsubscribe();
        };
    }, []);

    // Calculate lastUpdatedAgo + connectionStatus every second
    useEffect(() => {
        const interval = setInterval(() => {
            if (trackingData.lastUpdated) {
                const agoMs = Date.now() - trackingData.lastUpdated;
                const agoSec = Math.floor(agoMs / 1000);
                setLastUpdatedAgo(agoSec);

                if (agoMs < GPS_STALE_WARNING) {
                    setConnectionStatus('live');
                } else if (agoMs < GPS_STALE_CRITICAL) {
                    setConnectionStatus('delayed');
                } else {
                    setConnectionStatus('lost');
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [trackingData.lastUpdated]);

    return {
        ...trackingData,
        lastUpdatedAgo,
        connectionStatus,
        deviceConnected,
    };
}

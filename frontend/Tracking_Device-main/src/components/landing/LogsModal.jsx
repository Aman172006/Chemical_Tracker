import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Database, Clock, Activity, AlertTriangle, MapPin, Package } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';

/**
 * Converts a raw RTDB snapshot into a flat array of log entries.
 * Reads from three real RTDB root nodes:
 *   1. telemetry/latest  — the latest ESP32 telemetry frame
 *   2. live              — per-trip live data written by the backend
 *   3. active_alerts     — per-trip active alerts
 */
export function LogsModal({ isOpen, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all | telemetry | live | alerts

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        let telemetryData = null;
        let liveData = null;
        let alertsData = null;
        let received = 0;
        const TOTAL = 3;

        const buildLogs = () => {
            received++;
            if (received < TOTAL) return;          // wait for all three
            const combined = [];

            // 1. Telemetry snapshot → one log entry
            if (telemetryData) {
                combined.push({
                    id: 'telemetry-latest',
                    type: 'telemetry',
                    label: 'ESP32 Telemetry — Latest Frame',
                    timestamp: telemetryData.timestamp_ms || Date.now(),
                    data: telemetryData,
                });
            }

            // 2. Live trip entries → one log per trip
            if (liveData && typeof liveData === 'object') {
                Object.entries(liveData).forEach(([tripId, tripSnap]) => {
                    if (!tripSnap || typeof tripSnap !== 'object') return;
                    combined.push({
                        id: `live-${tripId}`,
                        type: 'live',
                        label: `Live Trip: ${tripId}`,
                        timestamp: tripSnap.lastUpdate || tripSnap.currentLocation?.timestamp || Date.now(),
                        data: tripSnap,
                    });
                });
            }

            // 3. Active alerts → one log per alert, nested under trips
            if (alertsData && typeof alertsData === 'object') {
                Object.entries(alertsData).forEach(([tripId, tripAlerts]) => {
                    if (!tripAlerts || typeof tripAlerts !== 'object') return;
                    Object.entries(tripAlerts).forEach(([alertId, alertSnap]) => {
                        if (!alertSnap || typeof alertSnap !== 'object') return;
                        combined.push({
                            id: `alert-${alertId}`,
                            type: 'alert',
                            label: alertSnap.message || `Alert ${alertId}`,
                            tripId,
                            severity: alertSnap.severity || 'medium',
                            timestamp: alertSnap.createdAt || Date.now(),
                            data: alertSnap,
                        });
                    });
                });
            }

            // Sort newest first
            combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setLogs(combined);
            setLoading(false);
        };

        // Listener refs
        const telemetryRef = ref(database, 'telemetry/latest');
        const liveRef = ref(database, 'live');
        const alertsRef = ref(database, 'active_alerts');

        const unsubTelemetry = onValue(telemetryRef, (snap) => {
            telemetryData = snap.exists() ? snap.val() : null;
            console.log('[LogsModal] telemetry/latest →', telemetryData);
            buildLogs();
        }, (err) => { console.error('[LogsModal] telemetry error', err); received++; buildLogs(); });

        const unsubLive = onValue(liveRef, (snap) => {
            liveData = snap.exists() ? snap.val() : null;
            console.log('[LogsModal] live →', liveData);
            buildLogs();
        }, (err) => { console.error('[LogsModal] live error', err); received++; buildLogs(); });

        const unsubAlerts = onValue(alertsRef, (snap) => {
            alertsData = snap.exists() ? snap.val() : null;
            console.log('[LogsModal] active_alerts →', alertsData);
            buildLogs();
        }, (err) => { console.error('[LogsModal] alerts error', err); received++; buildLogs(); });

        return () => {
            // Firebase v9 modular: onValue returns an unsubscribe function
            unsubTelemetry();
            unsubLive();
            unsubAlerts();
        };
    }, [isOpen]);

    // ---------- helpers ----------
    const filteredLogs = activeTab === 'all'
        ? logs
        : logs.filter((l) => l.type === activeTab);

    const typeIcon = (type) => {
        switch (type) {
            case 'telemetry': return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
            case 'live': return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
            case 'alert': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
            default: return <Package className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    const typeBadgeColor = (type) => {
        switch (type) {
            case 'telemetry': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
            case 'live': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'alert': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const severityBadge = (severity) => {
        const colors = {
            low: 'bg-blue-500/20 text-blue-300',
            medium: 'bg-yellow-500/20 text-yellow-300',
            high: 'bg-orange-500/20 text-orange-300',
            critical: 'bg-red-500/20 text-red-300',
        };
        return colors[severity] || colors.medium;
    };

    const tabs = [
        { key: 'all', label: 'All Logs' },
        { key: 'telemetry', label: 'Telemetry' },
        { key: 'live', label: 'Live Trips' },
        { key: 'alert', label: 'Alerts' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3 text-slate-200">
                                <div className="w-8 h-8 rounded-lg bg-olive-500/20 flex items-center justify-center border border-olive-500/30">
                                    <Terminal className="w-4 h-4 text-olive-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide">System Logs</h3>
                                    <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                        <Database className="w-3 h-3" /> Firebase RTDB — Live Data
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-800/50 bg-slate-900/30">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab.key
                                            ? 'bg-olive-500/20 text-olive-300 border border-olive-500/40'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <span className="ml-1.5 text-[9px] text-olive-400">
                                            ({filteredLogs.length})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Logs Content area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0f18] text-slate-300 font-mono text-xs">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    <span className="animate-pulse flex items-center gap-2">
                                        <Database className="w-4 h-4 animate-spin" />
                                        Fetching logs from Firebase RTDB...
                                    </span>
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                                    <Database className="w-8 h-8 opacity-40" />
                                    <p>No {activeTab === 'all' ? '' : activeTab + ' '}logs found in the database.</p>
                                    <p className="text-[10px] text-slate-700">
                                        Listening to: telemetry/latest, live/*, active_alerts/*
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/50 hover:border-olive-500/30 transition-colors"
                                        >
                                            {/* Log header */}
                                            <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 border-b border-slate-800 pb-2 flex-wrap">
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded border ${typeBadgeColor(log.type)}`}>
                                                    {typeIcon(log.type)}
                                                    {log.type.toUpperCase()}
                                                </span>
                                                {log.severity && (
                                                    <span className={`px-2 py-0.5 rounded font-bold ${severityBadge(log.severity)}`}>
                                                        {log.severity.toUpperCase()}
                                                    </span>
                                                )}
                                                {log.tripId && (
                                                    <span className="text-olive-600 font-bold bg-olive-500/10 px-2 py-0.5 rounded">
                                                        {log.tripId}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 ml-auto text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Log label */}
                                            <p className="text-[11px] text-slate-300 font-semibold mb-2">{log.label}</p>

                                            {/* Log data payload */}
                                            <div className="overflow-x-auto whitespace-pre-wrap text-[#4ade80] leading-relaxed text-[10px]">
                                                {JSON.stringify(log.data, null, 2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

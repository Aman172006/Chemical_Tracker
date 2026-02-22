import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Database, Clock } from 'lucide-react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export function LogsModal({ isOpen, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        const logsRef = ref(database, 'telemetry/latest/logs');

        const unsubscribe = onValue(logsRef, (snapshot) => {
            console.log("Logs snapshot exists?", snapshot.exists());
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log("Logs Raw Data:", data);

                try {
                    // Convert object to array and reverse to show newest first
                    const logsList = Object.entries(data).map(([key, value]) => ({
                        id: key,
                        // If it's just a primitive string log, handle it, else spread object
                        ...(typeof value === 'object' && value !== null ? value : { message: value })
                    })).reverse();

                    console.log("Parsed Logs List:", logsList);
                    setLogs(logsList);
                } catch (err) {
                    console.error("Error parsing logs:", err);
                    setLogs([{ id: 'error', message: 'Failed to parse database logs.' }]);
                }
            } else {
                setLogs([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching logs:", error);
            setLoading(false);
        });

        // Cleanup listener when closed or unmounted
        return () => {
            off(logsRef, 'value', unsubscribe);
        };
    }, [isOpen]);

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
                                        <Database className="w-3 h-3" /> Firebase RTDB /telemetry/latest/logs
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

                        {/* Logs Content area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0f18] text-slate-300 font-mono text-xs">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    <span className="animate-pulse flex items-center gap-2">
                                        <Database className="w-4 h-4 animate-spin" />
                                        Fetching logs securely...
                                    </span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-600">
                                    No logs found in the database.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/50 hover:border-olive-500/30 transition-colors">
                                            <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 border-b border-slate-800 pb-2">
                                                <span className="text-olive-600 font-bold bg-olive-500/10 px-2 py-0.5 rounded">ID: {log.id}</span>
                                                {log.timestamp && (
                                                    <span className="flex items-center gap-1 ml-auto text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="overflow-x-auto whitespace-pre-wrap text-[#4ade80] leading-relaxed">
                                                {JSON.stringify(
                                                    Object.keys(log)
                                                        .filter(k => k !== 'id' && k !== 'timestamp')
                                                        .reduce((obj, key) => {
                                                            obj[key] = log[key];
                                                            return obj;
                                                        }, {}),
                                                    null,
                                                    2
                                                ).replace(/[{}]/g, '')}
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

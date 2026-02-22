import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle } from 'lucide-react';
import { THREAT_INFO } from '../../utils/constants';
import { formatTimestamp } from '../../utils/formatters';

export function NotificationCenter({ alerts = [], onAcknowledge }) {
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = alerts.length;

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-cream transition-colors text-badge-400 hover:text-badge"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-mist shadow-xl z-[6000] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-mist">
                            <span className="text-sm font-bold text-badge">Notifications</span>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-cream">
                                <X className="w-4 h-4 text-badge-300" />
                            </button>
                        </div>

                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                            {alerts.length === 0 ? (
                                <div className="p-6 text-center">
                                    <Bell className="w-8 h-8 text-badge-200 mx-auto mb-2" />
                                    <p className="text-sm text-badge-300">All clear</p>
                                </div>
                            ) : (
                                alerts.map(alert => {
                                    const info = THREAT_INFO[alert.threatLevel] || THREAT_INFO[0];
                                    return (
                                        <div
                                            key={alert.id}
                                            className="px-4 py-3 border-b border-mist/50 hover:bg-cream/50 transition-colors flex items-start gap-3"
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ backgroundColor: info.bg }}
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5" style={{ color: info.accent }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-badge truncate">
                                                    {alert.message || 'Alert'}
                                                </p>
                                                <p className="text-[10px] text-badge-300 mt-0.5">
                                                    {formatTimestamp(alert.timestamp)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => onAcknowledge(alert.id)}
                                                className="p-1.5 rounded-md hover:bg-green-50 transition-colors"
                                                title="Acknowledge"
                                            >
                                                <Check className="w-3.5 h-3.5 text-badge-300 hover:text-green-500" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

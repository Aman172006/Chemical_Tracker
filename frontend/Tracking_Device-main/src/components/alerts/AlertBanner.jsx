import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, X } from 'lucide-react';
import { THREAT_INFO } from '../../utils/constants';

export function AlertBanner({ alerts = [], onAcknowledge, onViewOnMap }) {
    if (alerts.length === 0) return null;

    return (
        <div className="space-y-2">
            <AnimatePresence>
                {alerts.slice(0, 3).map((alert) => {
                    const info = THREAT_INFO[alert.threatLevel] || THREAT_INFO[1];
                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="rounded-xl overflow-hidden animate-slide-down"
                            style={{
                                backgroundColor: info.bg,
                                borderLeft: `4px solid ${info.accent}`
                            }}
                        >
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: info.accent }} />
                                    <div>
                                        <span className="text-sm font-semibold" style={{ color: info.text }}>
                                            {alert.threatLevel === 1
                                                ? `Route Deviation — ${alert.shipmentId || 'Unknown'}`
                                                : alert.threatLevel === 2
                                                    ? `Seal / Weight Alert — ${alert.shipmentId || 'Unknown'}`
                                                    : `Critical Alert — ${alert.shipmentId || 'Unknown'}`
                                            }
                                        </span>
                                        <p className="text-xs mt-0.5" style={{ color: info.text + 'CC' }}>
                                            {alert.message || 'Alert triggered'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {onViewOnMap && (
                                        <button
                                            onClick={() => onViewOnMap(alert)}
                                            className="px-3 py-1 text-xs font-semibold rounded-lg transition-colors"
                                            style={{ color: info.text, backgroundColor: info.accent + '15' }}
                                        >
                                            View on Map
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onAcknowledge(alert.id)}
                                        className="p-1 rounded-lg hover:bg-white/50 transition-colors"
                                        style={{ color: info.text }}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

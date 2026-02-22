import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatTimestamp } from '../../utils/formatters';
import { THREAT_INFO } from '../../utils/constants';

export function EventTimeline({ alerts = [] }) {
    if (alerts.length === 0) {
        return (
            <div className="text-center py-8">
                <ShieldCheck className="w-8 h-8 text-badge-200 mx-auto mb-2" />
                <p className="text-sm text-badge-300">No events recorded</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-olive-500" />
                <span className="text-xs font-bold text-badge uppercase tracking-wider">Event Timeline</span>
            </div>

            <div className="space-y-2">
                {alerts.slice(0, 20).map((alert, i) => {
                    const info = THREAT_INFO[alert.threatLevel] || THREAT_INFO[0];
                    return (
                        <motion.div
                            key={alert.id || i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-3 p-3 rounded-xl border border-mist hover:bg-cream transition-colors"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: info.bg }}
                            >
                                <AlertTriangle className="w-4 h-4" style={{ color: info.accent }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-badge truncate">{alert.message || alert.title || 'Alert'}</p>
                                <p className="text-[10px] text-badge-300 font-mono mt-0.5">
                                    {formatTimestamp(alert.createdAt?.toMillis?.() || alert.createdAt?.seconds * 1000)}
                                </p>
                            </div>
                            <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: info.bg, color: info.text }}
                            >
                                L{alert.threatLevel}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

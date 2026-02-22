import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export function DeviceStatusCard({ attached, secretId, lastUpdatedAgo }) {
    const [revealed, setRevealed] = useState(false);

    const maskedId = secretId
        ? secretId.substring(0, 4) + '••••••'
        : '••••••••';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-500 ${attached === false
                    ? 'border-2 border-red-500 bg-red-50 animate-pulse-red'
                    : 'border-mist'
                }`}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-olive-500" />
                <span className="text-xs font-bold text-badge uppercase tracking-wider">Device Status</span>
            </div>

            {/* Attached Status */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-badge-300">Device</span>
                <AnimatePresence mode="wait">
                    {attached !== false ? (
                        <motion.div
                            key="attached"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1.5"
                        >
                            <Wifi className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-semibold text-green-600">Attached</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detached"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-1.5"
                        >
                            <WifiOff className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-bold text-red-600 uppercase">Detached</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Secret ID */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-badge-300">Secret ID</span>
                <button
                    onClick={() => setRevealed(!revealed)}
                    className="flex items-center gap-1.5 group"
                >
                    <span className="font-mono text-sm text-badge-500 font-medium">
                        {revealed ? secretId : maskedId}
                    </span>
                    {revealed ? (
                        <EyeOff className="w-3.5 h-3.5 text-badge-300 group-hover:text-badge-500 transition-colors" />
                    ) : (
                        <Eye className="w-3.5 h-3.5 text-badge-300 group-hover:text-badge-500 transition-colors" />
                    )}
                </button>
            </div>

            {/* Last Signal */}
            {lastUpdatedAgo != null && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-mist">
                    <span className="text-xs text-badge-300">Last Signal</span>
                    <span className="text-xs font-mono text-badge-500">{formatTimeAgo(lastUpdatedAgo)}</span>
                </div>
            )}
        </motion.div>
    );
}

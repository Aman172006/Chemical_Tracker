import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { formatTimestamp } from '../../utils/formatters';

export function SealStatusCard({ intact, timestamp }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-mist rounded-2xl p-5 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-olive-500" />
                <span className="text-xs font-bold text-badge uppercase tracking-wider">Seal Status</span>
            </div>

            {/* Seal Inner Card */}
            <AnimatePresence mode="wait">
                {intact !== false ? (
                    <motion.div
                        key="intact"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-xl p-4 border"
                        style={{
                            backgroundColor: 'var(--alert-green-bg)',
                            borderColor: 'var(--alert-green-border)'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="text-sm font-bold text-green-700">INTACT</p>
                                <p className="text-xs text-green-600">Seal is secure</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="broken"
                        initial={{ opacity: 0, rotateY: -90 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        exit={{ opacity: 0, rotateY: 90 }}
                        transition={{ duration: 0.4 }}
                        className="rounded-xl p-4 border-2 animate-pulse-red"
                        style={{
                            backgroundColor: 'var(--alert-red-bg)',
                            borderColor: 'var(--alert-red)'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-600" />
                            <div>
                                <p className="text-sm font-bold text-red-700">BROKEN</p>
                                <p className="text-xs text-red-600">Seal compromised</p>
                                {timestamp && (
                                    <p className="text-[10px] text-red-500 mt-1">
                                        Detected at {formatTimestamp(timestamp)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

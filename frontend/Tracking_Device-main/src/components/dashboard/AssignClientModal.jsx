import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Copy, Check } from 'lucide-react';

export function AssignClientModal({ isOpen, onClose, shipment, onAssign }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !shipment) return null;

    const trackingUrl = `${window.location.origin}/track/${shipment.id}`;
    const secretId = shipment.secretId || 'CTK-UNKNOWN';

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            console.warn('Copy failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[8500] flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-badge/20 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white rounded-2xl border border-mist shadow-xl w-full max-w-md p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-olive-50 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-olive-500" />
                        </div>
                        <h3 className="text-lg font-bold text-badge">Assign Client</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream text-badge-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-cream rounded-xl">
                        <p className="text-[10px] text-badge-300 uppercase tracking-wider mb-1">Secret ID</p>
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-lg font-bold text-badge">{secretId}</span>
                            <button
                                onClick={() => handleCopy(secretId)}
                                className="p-2 rounded-lg hover:bg-mist transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-badge-300" />}
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-cream rounded-xl">
                        <p className="text-[10px] text-badge-300 uppercase tracking-wider mb-1">Tracking URL</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-badge-500 truncate flex-1">{trackingUrl}</span>
                            <button
                                onClick={() => handleCopy(trackingUrl)}
                                className="p-2 rounded-lg hover:bg-mist transition-colors flex-shrink-0"
                            >
                                <Copy className="w-3.5 h-3.5 text-badge-300" />
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-badge-300 text-center">
                        Share the Secret ID and tracking URL with your client for shipment visibility
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 transition-all"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

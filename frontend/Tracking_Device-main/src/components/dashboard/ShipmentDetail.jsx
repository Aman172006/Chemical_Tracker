import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Package, Calendar, Shield, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatTimestamp } from '../../utils/formatters';

export function ShipmentDetail({ shipment, onClose, onAssignClient }) {
    if (!shipment) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[8000] flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-badge/20 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                className="relative bg-white rounded-2xl border border-mist shadow-xl w-full max-w-lg max-h-[85vh] overflow-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-mist">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-olive-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-olive-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-badge font-mono">{shipment.tripId}</h3>
                            <p className="text-xs text-badge-300">{shipment.chemicalName || 'Chemical Shipment'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge level={shipment.threatLevel || 0} size="sm" />
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream text-badge-300 hover:text-badge">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Route */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-badge uppercase tracking-wider">Route</h4>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                <div className="w-0.5 h-8 bg-mist" />
                                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <p className="text-xs text-badge-300">Origin</p>
                                    <p className="text-sm text-badge font-medium">{shipment.startLocation?.address || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-badge-300">Destination</p>
                                    <p className="text-sm text-badge font-medium">{shipment.endLocation?.address || 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-cream rounded-xl">
                            <p className="text-[10px] text-badge-300 uppercase tracking-wider">Quantity</p>
                            <p className="text-sm font-mono font-bold text-badge">{shipment.chemicalQuantity || '—'}</p>
                        </div>
                        <div className="p-3 bg-cream rounded-xl">
                            <p className="text-[10px] text-badge-300 uppercase tracking-wider">Status</p>
                            <p className="text-sm font-semibold text-badge capitalize">{shipment.status || 'created'}</p>
                        </div>
                        <div className="p-3 bg-cream rounded-xl">
                            <p className="text-[10px] text-badge-300 uppercase tracking-wider">Secret ID</p>
                            <p className="text-sm font-mono text-badge-500">{shipment.currentSecretId || '—'}</p>
                        </div>
                        <div className="p-3 bg-cream rounded-xl">
                            <p className="text-[10px] text-badge-300 uppercase tracking-wider">Waypoints</p>
                            <p className="text-sm font-mono font-bold text-badge">{shipment.plannedRoute?.length || 0}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {onAssignClient && (
                            <button
                                onClick={onAssignClient}
                                className="flex-1 py-2.5 px-4 bg-olive-500 text-white text-sm font-semibold rounded-xl hover:bg-olive-600 transition-all shadow-sm"
                            >
                                Assign Client
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-cream border border-mist text-badge-500 text-sm font-semibold rounded-xl hover:bg-mist transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Play, Zap, AlertTriangle, Weight, Lock, Unplug } from 'lucide-react';
import api from '../../services/api';

/**
 * SimulationPanel — Sends simulated device data to POST /api/device/data
 * to trigger various alert scenarios.
 */
export function SimulationPanel({ shipmentId, shipment }) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState('');
    const [sending, setSending] = useState(false);

    const deviceId = shipment?.deviceId || 'ESP32_SIM_001';

    const sendDeviceData = async (overrides = {}) => {
        if (!shipmentId) {
            setStatus('No trip selected');
            return;
        }
        setSending(true);
        setStatus('Sending...');

        const baseData = {
            deviceId,
            tripId: shipmentId,
            location: {
                lat: shipment?.lastLocation?.lat || 28.6139,
                lng: shipment?.lastLocation?.lng || 77.2090,
            },
            weight: shipment?.currentWeight || 500,
            sealStatus: 'intact',
            deviceAttached: true,
            batteryLevel: 85,
            ...overrides,
        };

        try {
            const res = await api.post('/device/data', baseData);
            const d = res.data.data;
            setStatus(
                `✓ Sent | Alerts: ${d.alerts} | Progress: ${d.progress}%` +
                (d.newSecretId ? ' | New Secret ID!' : '')
            );
        } catch (err) {
            setStatus(`✗ Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setSending(false);
        }
    };

    const simulations = [
        {
            icon: Play,
            label: 'Normal Data',
            desc: 'Send normal telemetry',
            color: 'bg-olive-50 text-olive-600 border-olive-200',
            action: () => sendDeviceData(),
        },
        {
            icon: Zap,
            label: 'Route Deviation',
            desc: 'Move 2km off-route',
            color: 'bg-amber-50 text-amber-600 border-amber-200',
            action: () => sendDeviceData({
                location: {
                    lat: (shipment?.lastLocation?.lat || 28.6139) + 0.018,
                    lng: (shipment?.lastLocation?.lng || 77.2090) + 0.018,
                },
            }),
        },
        {
            icon: Weight,
            label: 'Weight Change',
            desc: 'Drop weight by 5kg',
            color: 'bg-orange-50 text-orange-600 border-orange-200',
            action: () => sendDeviceData({
                weight: (shipment?.currentWeight || 500) - 5,
            }),
        },
        {
            icon: Lock,
            label: 'Seal Tamper',
            desc: 'Break the seal',
            color: 'bg-red-50 text-red-600 border-red-200',
            action: () => sendDeviceData({
                sealStatus: 'tampered',
            }),
        },
        {
            icon: Unplug,
            label: 'Device Detach',
            desc: 'Remove tracker',
            color: 'bg-red-50 text-red-600 border-red-200',
            action: () => sendDeviceData({
                deviceAttached: false,
            }),
        },
        {
            icon: AlertTriangle,
            label: 'Low Battery',
            desc: 'Set battery to 10%',
            color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
            action: () => sendDeviceData({
                batteryLevel: 10,
            }),
        },
    ];

    return (
        <div className="bg-white border border-mist rounded-2xl shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-cream transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-olive-500" />
                    <span className="text-xs font-bold text-badge uppercase tracking-wider">Simulation Panel</span>
                    {shipmentId && (
                        <span className="text-[10px] font-mono text-badge-300 bg-cream px-2 py-0.5 rounded-md">
                            {shipmentId}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-badge-300" /> : <ChevronDown className="w-4 h-4 text-badge-300" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-0 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                {simulations.map(sim => (
                                    <button
                                        key={sim.label}
                                        onClick={sim.action}
                                        disabled={sending || !shipmentId}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center hover:shadow-sm transition-all disabled:opacity-40 ${sim.color}`}
                                    >
                                        <sim.icon className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{sim.label}</span>
                                        <span className="text-[9px] opacity-70">{sim.desc}</span>
                                    </button>
                                ))}
                            </div>

                            {status && (
                                <div className="text-xs font-mono text-badge-400 bg-cream rounded-xl px-3 py-2 border border-mist">
                                    {status}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SimulationPanel;

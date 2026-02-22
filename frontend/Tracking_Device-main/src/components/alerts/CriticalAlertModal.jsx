import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_TILES, MAP_ATTRIBUTION } from '../../utils/constants';
import { formatCoordinate } from '../../utils/formatters';

/**
 * CriticalAlertModal — Level 3 full-screen unclosable alert
 * Only the Acknowledge button can close it.
 */
export function CriticalAlertModal({ alert, onAcknowledge }) {
    const [secondsSince, setSecondsSince] = useState(0);
    const [vignetteOpacity, setVignetteOpacity] = useState(0.05);

    const isActive = alert && !alert.acknowledged;

    // Counter + vignette pulse
    useEffect(() => {
        if (!isActive) return;

        const startTime = alert.createdAt?.toMillis?.()
            || alert.createdAt?.seconds * 1000
            || Date.now();

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setSecondsSince(Math.max(0, elapsed));
        }, 1000);

        // Vignette pulse
        const pulseInterval = setInterval(() => {
            setVignetteOpacity(prev => prev === 0.05 ? 0.12 : 0.05);
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(pulseInterval);
        };
    }, [isActive, alert?.id]);

    // Block escape key
    useEffect(() => {
        if (!isActive) return;
        const handler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('keydown', handler, { capture: true });
        return () => document.removeEventListener('keydown', handler, { capture: true });
    }, [isActive]);

    const location = alert?.location || alert?.data?.currentPosition || { lat: 28.6139, lng: 77.2090 };
    const shipmentId = alert?.shipmentId || 'UNKNOWN';

    const redMarkerIcon = useMemo(() => L.divIcon({
        className: 'custom-div-icon',
        html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="position:absolute;top:50%;left:50%;width:40px;height:40px;margin:-20px;border-radius:50%;background:#DC2626;opacity:0.15;animation:critical-ripple 1.5s infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;width:30px;height:30px;margin:-15px;border-radius:50%;background:#DC2626;opacity:0.25;animation:critical-ripple 1.5s infinite 0.3s;"></div>
        <div style="position:absolute;top:50%;left:50%;width:16px;height:16px;margin:-8px;border-radius:50%;background:#DC2626;border:3px solid white;box-shadow:0 0 12px rgba(220,38,38,0.4);"></div>
      </div>
      <style>
        @keyframes critical-ripple { 0%{transform:scale(1);opacity:0.3;} 100%{transform:scale(3);opacity:0;} }
      </style>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    }), []);

    // Time color gets redder
    const timeColor = secondsSince < 30 ? '#DC2626' : secondsSince < 60 ? '#B91C1C' : '#7F1D1D';

    if (!isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Full-screen Overlay with Pulsing Vignette */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle at center, rgba(220,38,38,${vignetteOpacity}) 0%, rgba(255,255,255,0.97) 60%)`,
                        backdropFilter: 'blur(4px)',
                        transition: 'background 1s ease'
                    }}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden"
                    style={{
                        border: '2px solid #DC2626',
                        boxShadow: '0 0 40px rgba(220,38,38,0.15)'
                    }}
                >
                    <div className="p-8 text-center">
                        {/* Pulsing Red Circle */}
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="absolute w-[100px] h-[100px] rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                            <div className="absolute w-[80px] h-[80px] rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                                <span className="text-white text-2xl">🔴</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-red-600 mb-1 tracking-wide">
                            CRITICAL: TRACKER REMOVED
                        </h2>
                        <p className="text-sm text-badge-500 mb-6">
                            Shipment <span className="font-mono font-bold">{shipmentId}</span>
                        </p>

                        {/* Divider */}
                        <div className="w-full h-px bg-mist mb-6" />

                        {/* Info Row */}
                        <div className="flex justify-between mb-4">
                            <div className="text-left">
                                <p className="text-[10px] text-badge-300 uppercase tracking-wider mb-1">Last Known Location</p>
                                <p className="font-mono text-sm text-badge font-medium">
                                    {formatCoordinate(location.lat, 'lat')}, {formatCoordinate(location.lng, 'lng')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-badge-300 uppercase tracking-wider mb-1">Time Since Signal</p>
                                <p
                                    className="font-mono text-lg font-bold"
                                    style={{ color: timeColor }}
                                >
                                    {secondsSince}s
                                </p>
                            </div>
                        </div>

                        {/* Mini Map */}
                        <div className="rounded-xl overflow-hidden border border-mist mb-6" style={{ height: '200px' }}>
                            <MapContainer
                                center={[location.lat, location.lng]}
                                zoom={14}
                                scrollWheelZoom={false}
                                dragging={false}
                                zoomControl={false}
                                className="w-full h-full"
                            >
                                <TileLayer url={MAP_TILES} attribution={MAP_ATTRIBUTION} />
                                <Marker
                                    position={[location.lat, location.lng]}
                                    icon={redMarkerIcon}
                                />
                            </MapContainer>
                        </div>

                        {/* Acknowledge Button */}
                        <button
                            onClick={() => onAcknowledge(alert.id)}
                            className="w-full py-3 px-6 bg-red-600 text-white font-semibold text-sm rounded-xl transition-all hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
                            style={{
                                boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                            }}
                        >
                            ACKNOWLEDGE & DISMISS
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

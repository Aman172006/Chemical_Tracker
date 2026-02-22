import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_TILES, MAP_ATTRIBUTION, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../utils/constants';
import { CurrentPositionMarker } from './CurrentPositionMarker';
import { RoutePolyline } from './RoutePolyline';
import { ActualPathPolyline } from './ActualPathPolyline';
import { DeviationPopup } from './DeviationPopup';
import { WaypointMarkers } from './WaypointMarkers';
import { CheckpointMarkers } from './CheckpointMarkers';
import { SpeedBadge } from './SpeedBadge';
import { Navigation, AlertTriangle, ShieldAlert, Route } from 'lucide-react';

// Auto-pan to follow shipment
function MapFollower({ position, following }) {
    const map = useMap();
    useEffect(() => {
        if (following && position && position[0] !== 0) {
            map.flyTo(position, map.getZoom(), { duration: 1 });
        }
    }, [position?.[0], position?.[1], following]);
    return null;
}

// Recenter on shipment change
function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] !== 0) {
            map.flyTo(center, 13, { duration: 1.5 });
        }
    }, [center?.[0], center?.[1]]);
    return null;
}

export function TrackingMap({
    shipment,
    trackingData,
    pathPoints = [],
    isDeviated = false,
    deviationDistance = 0,
    toleranceMeters = 20,
    onAcknowledgeDeviation,
    onRequestReroute
}) {
    const [following, setFollowing] = useState(true);

    const prevPosRef = useRef([0, 0]);

    const currentPos = useMemo(() => {
        const lat = trackingData?.lat || 0;
        const lng = trackingData?.lng || 0;
        return [lat, lng];
    }, [trackingData?.lat, trackingData?.lng]);

    // Track previous position for heading calculation
    const previousPos = prevPosRef.current;
    useEffect(() => {
        if (currentPos[0] !== 0 || currentPos[1] !== 0) {
            prevPosRef.current = currentPos;
        }
    }, [currentPos]);

    const assignedRoute = shipment?.assignedRoute || shipment?.plannedRoute || [];
    const threatLevel = shipment?.threatLevel || 0;
    const checkpoints = shipment?.checkpoints || [];
    const checkpointsCrossed = shipment?.checkpointsCrossed || [];
    const isCompromised = shipment?.compromised || false;

    const initialCenter = currentPos[0] !== 0 ? currentPos : DEFAULT_CENTER;

    return (
        <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
            <MapContainer
                center={initialCenter}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ minHeight: '400px' }}
            >
                <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILES} />

                <MapRecenter center={currentPos} />
                <MapFollower position={currentPos} following={following} />

                {/* Assigned Route (solid olive) */}
                <RoutePolyline positions={assignedRoute} />

                {/* Actual Path Taken (green/red based on deviation) */}
                <ActualPathPolyline pathPoints={pathPoints} plannedRoute={assignedRoute} />

                {/* Waypoint Markers (origin/dest) */}
                <WaypointMarkers
                    assignedRoute={assignedRoute}
                    originAddress={shipment?.originAddress || shipment?.startLocation?.address}
                    destinationAddress={shipment?.destinationAddress || shipment?.endLocation?.address}
                />

                {/* Checkpoint Markers (numbered, green=crossed, blue=pending) */}
                <CheckpointMarkers
                    checkpoints={checkpoints}
                    crossedOrders={checkpointsCrossed}
                />

                {/* Current Position Marker */}
                <CurrentPositionMarker
                    position={currentPos}
                    previousPosition={previousPos}
                    threatLevel={isDeviated ? Math.max(threatLevel, 1) : threatLevel}
                    speed={trackingData?.speed}
                    shipmentId={shipment?.batchId || shipment?.id}
                />

                {/* Speed Badge */}
                <SpeedBadge position={currentPos} speed={trackingData?.speed} />

                {/* Deviation Popup (auto-opens) */}
                <DeviationPopup
                    position={currentPos}
                    isDeviated={isDeviated}
                    deviationDistance={deviationDistance}
                    toleranceMeters={toleranceMeters}
                    shipmentId={shipment?.batchId || shipment?.id}
                    onAcknowledge={onAcknowledgeDeviation}
                />
            </MapContainer>

            {/* Follow / Free Pan Toggle */}
            <button
                onClick={() => setFollowing(!following)}
                className={`absolute top-4 right-4 z-[1000] flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all shadow-sm ${following
                    ? 'bg-olive-500 text-white border-olive-600'
                    : 'bg-white text-badge-500 border-mist hover:bg-cream'
                    }`}
            >
                <Navigation className="w-3.5 h-3.5" />
                {following ? 'Following' : 'Free Pan'}
            </button>

            {/* ─── COMPROMISED BADGE (permanent) ─── */}
            {isCompromised && (
                <div className="absolute top-4 left-4 z-[1000] bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                    <ShieldAlert className="w-4 h-4" />
                    <div>
                        <div className="text-xs font-bold">TRIP COMPROMISED</div>
                        <div className="text-[10px] opacity-80">Route deviation detected — permanent flag</div>
                    </div>
                </div>
            )}

            {/* ─── REQUEST REROUTE BUTTON ─── */}
            {isDeviated && onRequestReroute && (
                <button
                    onClick={onRequestReroute}
                    className="absolute top-16 right-4 z-[1000] flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg border border-amber-600 text-xs font-semibold shadow-sm hover:bg-amber-600 transition-all"
                >
                    <Route className="w-3.5 h-3.5" />
                    Request Reroute
                </button>
            )}

            {/* ─── CHECKPOINT PROGRESS ─── */}
            {checkpoints.length > 0 && (
                <div className="absolute bottom-14 left-4 z-[1000] bg-white/95 backdrop-blur-sm border border-mist px-3 py-2 rounded-lg shadow-sm">
                    <div className="text-[10px] font-bold text-badge-500 uppercase tracking-widest mb-1">Checkpoints</div>
                    <div className="flex items-center gap-1">
                        {checkpoints.map((cp) => {
                            const crossed = checkpointsCrossed.includes(cp.order);
                            return (
                                <div
                                    key={cp.order}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white shadow-sm ${crossed
                                        ? 'bg-green-500 text-white'
                                        : 'bg-blue-500 text-white'
                                        }`}
                                    title={`${cp.label}: ${crossed ? 'Crossed' : 'Pending'}`}
                                >
                                    {crossed ? '✓' : cp.order}
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-[9px] text-badge-300 mt-0.5">
                        {checkpointsCrossed.length}/{checkpoints.length} crossed
                    </div>
                </div>
            )}

            {/* Signal Indicator */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white border border-mist px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${trackingData?.connectionStatus === 'live'
                    ? 'bg-olive-500 animate-pulse'
                    : trackingData?.connectionStatus === 'delayed'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`} />
                <span className="text-[10px] font-mono font-bold text-badge-500 uppercase tracking-widest">
                    {trackingData?.connectionStatus === 'live'
                        ? 'Signal Locked'
                        : trackingData?.connectionStatus === 'delayed'
                            ? 'Signal Weak'
                            : 'Signal Lost'}
                </span>
            </div>
        </div>
    );
}

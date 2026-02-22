import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

/**
 * WaypointMarkers — ONLY origin and destination markers.
 * Intermediate waypoints are NOT rendered (route polyline handles the path).
 * Checkpoints are handled by CheckpointMarkers component.
 */
export function WaypointMarkers({ assignedRoute = [], originAddress, destinationAddress }) {
    if (!assignedRoute || assignedRoute.length === 0) return null;

    const originIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      width:14px;height:14px;
      background:#16A34A;
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 2px 4px rgba(0,0,0,0.15);
    "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    const destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="
      width:14px;height:14px;
      background:#DC2626;
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 2px 4px rgba(0,0,0,0.15);
    "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    return (
        <>
            {/* Origin */}
            <Marker position={assignedRoute[0]} icon={originIcon}>
                <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600 }}>
                        {originAddress || 'Origin'}
                    </span>
                </Tooltip>
            </Marker>

            {/* Destination */}
            {assignedRoute.length > 1 && (
                <Marker position={assignedRoute[assignedRoute.length - 1]} icon={destIcon}>
                    <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600 }}>
                            {destinationAddress || 'Destination'}
                        </span>
                    </Tooltip>
                </Marker>
            )}
        </>
    );
}

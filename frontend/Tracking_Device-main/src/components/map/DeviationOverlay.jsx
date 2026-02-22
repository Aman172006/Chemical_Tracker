import React from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';

export function DeviationOverlay({ currentPos, assignedRoute, projectedPath }) {
    if (!currentPos || currentPos[0] === 0 || !assignedRoute || assignedRoute.length < 1) return null;

    // Find the closest point on the assigned route to the current position
    // (Simplified for visual overlay)
    const lastPoint = assignedRoute[assignedRoute.length - 1];

    const deviationLine = [currentPos, lastPoint];

    return (
        <>
            {/* Deviation Bridge */}
            <Polyline
                positions={deviationLine}
                pathOptions={{
                    color: '#D97706',
                    weight: 2,
                    opacity: 0.8,
                    dashArray: '5, 10'
                }}
            />

            {/* Projected Path */}
            {projectedPath && projectedPath.length > 0 && (
                <Polyline
                    positions={[currentPos, ...projectedPath]}
                    pathOptions={{
                        color: '#D97706',
                        weight: 3,
                        opacity: 0.4,
                        dashArray: '2, 8'
                    }}
                />
            )}

            {/* Ghost Marker for projected end */}
            {projectedPath && projectedPath.length > 0 && (
                <CircleMarker
                    center={projectedPath[projectedPath.length - 1]}
                    radius={4}
                    pathOptions={{ color: '#D97706', fillColor: '#D97706', fillOpacity: 0.8 }}
                >
                    <Popup>
                        <div className="p-1">
                            <p className="text-[10px] font-bold text-alert-amber-text uppercase tracking-widest">Projected Heading</p>
                        </div>
                    </Popup>
                </CircleMarker>
            )}
        </>
    );
}

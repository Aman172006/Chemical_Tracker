import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';

/**
 * ActualPathPolyline — GPS trail split into green (on-route) and red (deviated) segments.
 * Each pathPoint has { lat, lng, isDeviated? } flag from the backend.
 * If no deviation flags, falls back to olive dashed line.
 */
export function ActualPathPolyline({ pathPoints = [], plannedRoute = [] }) {
    if (!pathPoints || pathPoints.length < 2) return null;

    // Segment the path into on-route (green) and deviated (red) chunks
    const segments = useMemo(() => {
        const segs = [];
        let currentSeg = {
            isDeviated: !!pathPoints[0]?.isDeviated,
            points: [[pathPoints[0].lat, pathPoints[0].lng]],
        };

        for (let i = 1; i < pathPoints.length; i++) {
            const pt = pathPoints[i];
            const deviated = !!pt.isDeviated;

            if (deviated === currentSeg.isDeviated) {
                currentSeg.points.push([pt.lat, pt.lng]);
            } else {
                // Add overlap point for seamless connection
                currentSeg.points.push([pt.lat, pt.lng]);
                segs.push(currentSeg);
                currentSeg = {
                    isDeviated: deviated,
                    points: [[pt.lat, pt.lng]],
                };
            }
        }
        segs.push(currentSeg);
        return segs;
    }, [pathPoints]);

    // Check if any pathPoints have isDeviated flag — if not, use simple dashed line
    const hasDeviationFlags = pathPoints.some(p => p.isDeviated !== undefined);

    if (!hasDeviationFlags) {
        // Legacy fallback: simple olive dashed line
        return (
            <Polyline
                positions={pathPoints.map(p => [p.lat, p.lng])}
                pathOptions={{
                    color: '#445A26',
                    weight: 3,
                    opacity: 0.7,
                    dashArray: '8 6',
                    lineCap: 'round',
                    lineJoin: 'round'
                }}
            />
        );
    }

    return (
        <>
            {segments.map((seg, i) => (
                <Polyline
                    key={`path-seg-${i}`}
                    positions={seg.points}
                    pathOptions={{
                        color: seg.isDeviated ? '#DC2626' : '#16A34A',
                        weight: seg.isDeviated ? 4 : 3,
                        opacity: 0.85,
                        lineCap: 'round',
                        lineJoin: 'round',
                        dashArray: seg.isDeviated ? '6 4' : undefined,
                    }}
                />
            ))}
        </>
    );
}

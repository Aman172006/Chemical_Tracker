import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';

// Douglas-Peucker: keeps shape-defining points, removes straight-segment duplicates
function perpendicularDist(point, lineStart, lineEnd) {
    const dx = lineEnd[1] - lineStart[1];
    const dy = lineEnd[0] - lineStart[0];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((point[1] - lineStart[1]) ** 2 + (point[0] - lineStart[0]) ** 2);
    const t = Math.max(0, Math.min(1, ((point[1] - lineStart[1]) * dx + (point[0] - lineStart[0]) * dy) / lenSq));
    return Math.sqrt((point[1] - (lineStart[1] + t * dx)) ** 2 + (point[0] - (lineStart[0] + t * dy)) ** 2);
}

function douglasPeucker(points, epsilon) {
    if (points.length <= 2) return points;
    let maxDist = 0, maxIdx = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDist(points[i], points[0], points[points.length - 1]);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon) {
        const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
        const right = douglasPeucker(points.slice(maxIdx), epsilon);
        return left.slice(0, -1).concat(right);
    }
    return [points[0], points[points.length - 1]];
}

/**
 * RoutePolyline — the assigned route (solid olive line)
 * Uses Douglas-Peucker to simplify large routes while preserving road shape.
 */
export function RoutePolyline({ positions = [] }) {
    if (!positions || positions.length < 2) return null;

    const simplified = useMemo(() => {
        // Convert to [lat, lng] array format if needed
        const pts = positions.map(p =>
            Array.isArray(p) ? p : [p.lat || p[0], p.lng || p[1]]
        );
        if (pts.length <= 300) return pts;
        let epsilon = 0.0001;
        let result = douglasPeucker(pts, epsilon);
        while (result.length > 800 && epsilon < 0.01) {
            epsilon *= 1.5;
            result = douglasPeucker(pts, epsilon);
        }
        return result;
    }, [positions]);

    return (
        <Polyline
            positions={simplified}
            pathOptions={{
                color: '#6B8C3E',
                weight: 3,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
            }}
        />
    );
}

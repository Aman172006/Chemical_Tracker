/**
 * CHEMTRACK — Geo Utilities
 * Haversine distance, route deviation, bearing, reverse geocoding
 */

const R = 6371000; // Earth radius in meters

/**
 * Haversine distance between two GPS coordinates (in meters)
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Perpendicular (or endpoint) distance from point P to segment AB (in meters)
 */
export function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) {
        return haversineDistance(px, py, ax, ay);
    }
    let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    const closestLat = ax + t * dx;
    const closestLng = ay + t * dy;
    return haversineDistance(px, py, closestLat, closestLng);
}

/**
 * Minimum distance from a point to the entire route polyline (in meters)
 * @param {Object} point - { lat, lng }
 * @param {Array} route  - [[lat, lng], [lat, lng], ...]
 * @returns {number} distance in meters
 */
export function distanceFromRoute(point, route) {
    if (!route || route.length === 0) return 0;
    if (route.length === 1) {
        return haversineDistance(point.lat, point.lng, route[0][0], route[0][1]);
    }

    let minDist = Infinity;

    // Check each segment
    for (let i = 0; i < route.length - 1; i++) {
        const dist = pointToSegmentDistance(
            point.lat, point.lng,
            route[i][0], route[i][1],
            route[i + 1][0], route[i + 1][1]
        );
        if (dist < minDist) minDist = dist;
    }

    // Also check each waypoint directly
    for (const wp of route) {
        const dist = haversineDistance(point.lat, point.lng, wp[0], wp[1]);
        if (dist < minDist) minDist = dist;
    }

    return minDist;
}

/**
 * Check if current location deviates from assigned route
 * @param {Object} currentLocation - { lat, lng }
 * @param {Array}  assignedRoute   - [[lat, lng], ...]
 * @param {number} toleranceMeters - default 20
 * @returns {{ isDeviated: boolean, deviationDistance: number, toleranceMeters: number, nearestPoint: Object|null }}
 */
export function checkDeviation(currentLocation, assignedRoute, toleranceMeters = 20) {
    if (!currentLocation || !assignedRoute || assignedRoute.length === 0) {
        return { isDeviated: false, deviationDistance: 0, toleranceMeters, nearestPoint: null };
    }

    const distance = distanceFromRoute(currentLocation, assignedRoute);

    // Find nearest waypoint for reference
    let nearestPoint = null;
    let nearestDist = Infinity;
    for (const wp of assignedRoute) {
        const d = haversineDistance(currentLocation.lat, currentLocation.lng, wp[0], wp[1]);
        if (d < nearestDist) {
            nearestDist = d;
            nearestPoint = { lat: wp[0], lng: wp[1] };
        }
    }

    return {
        isDeviated: distance > toleranceMeters,
        deviationDistance: Math.round(distance),
        toleranceMeters,
        nearestPoint
    };
}

/**
 * Bearing (heading) from point 1 to point 2, in degrees
 */
export function getBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const la1 = lat1 * Math.PI / 180;
    const la2 = lat2 * Math.PI / 180;
    const x = Math.sin(dLng) * Math.cos(la2);
    const y = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
    const bearing = (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
    return bearing;
}

/**
 * Reverse geocode coordinates via Nominatim
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} human-readable address
 */
export async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Legacy alias for backward compatibility
export const getPointToLineDistance = (point, route) => {
    return distanceFromRoute({ lat: point[0], lng: point[1] }, route);
};

export const projectDestination = (history) => {
    if (!history || history.length < 2) return null;
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    const bearing = getBearing(prev[0], prev[1], last[0], last[1]);
    const dist = haversineDistance(prev[0], prev[1], last[0], last[1]);
    const dLat = dist * Math.cos(bearing * Math.PI / 180) / R * (180 / Math.PI);
    const dLng = dist * Math.sin(bearing * Math.PI / 180) / (R * Math.cos(last[0] * Math.PI / 180)) * (180 / Math.PI);
    return { lat: last[0] + dLat, lng: last[1] + dLng };
};

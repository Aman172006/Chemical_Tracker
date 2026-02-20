const geolib = require("geolib");

// ============================================
// GPS DISTANCE & ROUTE UTILITIES
// ============================================

/**
 * Calculate distance between two GPS points (in meters)
 * Uses Haversine formula
 */
const getDistance = (point1, point2) => {
  try {
    if (!point1 || !point2) return 0;
    if (!point1.lat || !point1.lng || !point2.lat || !point2.lng) return 0;

    return geolib.getDistance(
      { latitude: point1.lat, longitude: point1.lng },
      { latitude: point2.lat, longitude: point2.lng }
    );
  } catch (error) {
    console.error("Distance calculation error:", error.message);
    return 0;
  }
};

/**
 * Check if a point is within a certain radius of another point
 * Returns true if within radius
 */
const isWithinRadius = (center, point, radiusMeters) => {
  const distance = getDistance(center, point);
  return distance <= radiusMeters;
};

/**
 * Find shortest distance from a point to a route line
 * Route is an array of waypoints [{lat, lng}, {lat, lng}, ...]
 * Returns distance in meters
 */
const distanceFromRoute = (point, route) => {
  try {
    if (!route || route.length === 0) return 0;
    if (!point || !point.lat || !point.lng) return 0;

    // If only one waypoint, calculate direct distance
    if (route.length === 1) {
      return getDistance(point, route[0]);
    }

    let minDistance = Infinity;

    // Check distance from point to each segment of the route
    for (let i = 0; i < route.length - 1; i++) {
      const segmentStart = route[i];
      const segmentEnd = route[i + 1];

      // Distance from point to this segment
      const distToSegment = distanceToSegment(point, segmentStart, segmentEnd);

      if (distToSegment < minDistance) {
        minDistance = distToSegment;
      }
    }

    // Also check distance to each waypoint
    for (const waypoint of route) {
      const dist = getDistance(point, waypoint);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance;
  } catch (error) {
    console.error("Route distance calculation error:", error.message);
    return 0;
  }
};

/**
 * Distance from a point to a line segment
 */
const distanceToSegment = (point, segStart, segEnd) => {
  const d1 = getDistance(point, segStart);
  const d2 = getDistance(point, segEnd);
  const segLength = getDistance(segStart, segEnd);

  // If segment is very short, just return distance to nearest endpoint
  if (segLength < 1) return Math.min(d1, d2);

  // Use perpendicular distance approximation
  // Project point onto line and check if projection falls on segment
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.lat - segStart.lat) * (segEnd.lat - segStart.lat) +
        (point.lng - segStart.lng) * (segEnd.lng - segStart.lng)) /
        (Math.pow(segEnd.lat - segStart.lat, 2) +
          Math.pow(segEnd.lng - segStart.lng, 2))
    )
  );

  const projectedPoint = {
    lat: segStart.lat + t * (segEnd.lat - segStart.lat),
    lng: segStart.lng + t * (segEnd.lng - segStart.lng),
  };

  return getDistance(point, projectedPoint);
};

/**
 * Check if a point deviates from the planned route
 * Returns { isDeviated, deviationDistance }
 */
const checkRouteDeviation = (currentLocation, plannedRoute, toleranceMeters) => {
  const deviation = distanceFromRoute(currentLocation, plannedRoute);

  return {
    isDeviated: deviation > toleranceMeters,
    deviationDistance: Math.round(deviation),
    toleranceMeters: toleranceMeters,
  };
};

/**
 * Calculate total route distance (sum of all segments)
 */
const totalRouteDistance = (route) => {
  if (!route || route.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += getDistance(route[i], route[i + 1]);
  }
  return total;
};

module.exports = {
  getDistance,
  isWithinRadius,
  distanceFromRoute,
  checkRouteDeviation,
  totalRouteDistance,
};
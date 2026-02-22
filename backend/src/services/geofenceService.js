const { getDistance, isWithinRadius, checkRouteDeviation } = require("../utils/distanceCalculator");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");

// ============================================
// GEOFENCE SERVICE
// ============================================

/**
 * Check if new secret ID should be generated
 * Based on distance from last ID generation point
 */
const shouldGenerateNewId = (currentLocation, lastIdLocation) => {
  if (!lastIdLocation || !lastIdLocation.lat || !lastIdLocation.lng) {
    return {
      shouldGenerate: true,
      distance: 0,
      threshold: CONSTANTS.THRESHOLDS.SECRET_ID_DISTANCE_M,
    };
  }

  if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
    return {
      shouldGenerate: false,
      distance: 0,
      threshold: CONSTANTS.THRESHOLDS.SECRET_ID_DISTANCE_M,
    };
  }

  const distance = getDistance(currentLocation, lastIdLocation);

  return {
    shouldGenerate: distance >= CONSTANTS.THRESHOLDS.SECRET_ID_DISTANCE_M,
    distance: Math.round(distance),
    threshold: CONSTANTS.THRESHOLDS.SECRET_ID_DISTANCE_M,
  };
};

/**
 * Check if container is deviating from planned route
 * Uses point-to-line-segment distance with GPS tolerance
 */
const checkDeviation = (currentLocation, plannedRoute) => {
  if (!plannedRoute || plannedRoute.length === 0) {
    return {
      isDeviated: false,
      deviationDistance: 0,
      toleranceMeters: CONSTANTS.THRESHOLDS.ROUTE_DEVIATION_M,
    };
  }

  if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
    return {
      isDeviated: false,
      deviationDistance: 0,
      toleranceMeters: CONSTANTS.THRESHOLDS.ROUTE_DEVIATION_M,
    };
  }

  return checkRouteDeviation(
    currentLocation,
    plannedRoute,
    CONSTANTS.THRESHOLDS.ROUTE_DEVIATION_M
  );
};

/**
 * Check checkpoint proximity — mark checkpoints as crossed
 * Uses GPS_MATCH_TOLERANCE_M for GPS accuracy margin
 * Returns which checkpoints are now crossed
 */
const checkCheckpoints = (currentLocation, checkpoints, alreadyCrossed = []) => {
  if (!checkpoints || checkpoints.length === 0 || !currentLocation) {
    return { newlyCrossed: [], allCrossed: alreadyCrossed };
  }

  const newlyCrossed = [];

  for (const cp of checkpoints) {
    // Skip already crossed
    if (alreadyCrossed.includes(cp.order)) continue;

    const distance = getDistance(currentLocation, { lat: cp.lat, lng: cp.lng });

    // Use CHECKPOINT_PROXIMITY_M (200m default) to account for GPS inaccuracy
    if (distance <= CONSTANTS.THRESHOLDS.CHECKPOINT_PROXIMITY_M) {
      newlyCrossed.push({
        order: cp.order,
        label: cp.label || `Checkpoint ${cp.order}`,
        crossedAt: new Date().toISOString(),
        distance: Math.round(distance),
      });
      logger.info(
        `Checkpoint ${cp.order} crossed (${Math.round(distance)}m away, threshold: ${CONSTANTS.THRESHOLDS.CHECKPOINT_PROXIMITY_M}m)`
      );
    }
  }

  const allCrossed = [
    ...alreadyCrossed,
    ...newlyCrossed.map((c) => c.order),
  ];

  return { newlyCrossed, allCrossed };
};

/**
 * Check if GPS position matches a route start (within tolerance)
 * Used to verify device is at the starting point before activating tracking
 */
const isAtRouteStart = (deviceLocation, startLocation) => {
  if (!deviceLocation || !startLocation) return false;

  const distance = getDistance(deviceLocation, startLocation);
  const tolerance = CONSTANTS.THRESHOLDS.GPS_MATCH_TOLERANCE_M;

  return {
    matches: distance <= tolerance,
    distance: Math.round(distance),
    tolerance,
  };
};

/**
 * Calculate distance covered from start
 */
const getDistanceFromStart = (currentLocation, startLocation) => {
  if (!currentLocation || !startLocation) return 0;
  return getDistance(currentLocation, startLocation);
};

/**
 * Calculate remaining distance to destination
 */
const getDistanceToEnd = (currentLocation, endLocation) => {
  if (!currentLocation || !endLocation) return 0;
  return getDistance(currentLocation, endLocation);
};

/**
 * Get trip progress percentage
 */
const getTripProgress = (currentLocation, startLocation, endLocation) => {
  const totalDistance = getDistance(startLocation, endLocation);
  if (totalDistance === 0) return 0;

  const covered = getDistance(startLocation, currentLocation);
  const progress = Math.min(100, Math.round((covered / totalDistance) * 100));

  return progress;
};

module.exports = {
  shouldGenerateNewId,
  checkDeviation,
  checkCheckpoints,
  isAtRouteStart,
  getDistanceFromStart,
  getDistanceToEnd,
  getTripProgress,
};
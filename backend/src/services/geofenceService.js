const { getDistance, checkRouteDeviation } = require("../utils/distanceCalculator");
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
    // No previous location, generate first ID
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
  getDistanceFromStart,
  getDistanceToEnd,
  getTripProgress,
};
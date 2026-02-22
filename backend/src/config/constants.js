require("dotenv").config();

// ============================================
// APPLICATION CONSTANTS
// ============================================

const CONSTANTS = {
  // User Roles
  ROLES: {
    OWNER: "owner",
    RECEIVER: "receiver",
    ADMIN: "admin",
  },

  // Trip Status
  TRIP_STATUS: {
    CREATED: "created",
    ACTIVE: "active",
    COMPLETED: "completed",
    ALERT: "alert",
    CANCELLED: "cancelled",
  },

  // Container Status
  CONTAINER_STATUS: {
    IDLE: "idle",
    IN_TRANSIT: "in-transit",
    DELIVERED: "delivered",
    TAMPERED: "tampered",
  },

  // Seal Status
  SEAL_STATUS: {
    INTACT: "intact",
    TAMPERED: "tampered",
  },

  // Alert Types
  ALERT_TYPES: {
    WEIGHT_DECREASE: "weight_decrease",
    SEAL_TAMPERED: "seal_tampered",
    ROUTE_DEVIATION: "route_deviation",
    DEVICE_DETACHED: "device_detached",
    LOW_BATTERY: "low_battery",
    CONNECTION_LOST: "connection_lost",
  },

  // Alert Severity
  ALERT_SEVERITY: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  },

  // Thresholds
  THRESHOLDS: {
    WEIGHT_TOLERANCE_KG: parseFloat(process.env.WEIGHT_TOLERANCE_KG) || 0.5,
    ROUTE_DEVIATION_M: parseFloat(process.env.ROUTE_DEVIATION_TOLERANCE_M) || 500,
    SECRET_ID_DISTANCE_M: parseFloat(process.env.SECRET_ID_DISTANCE_THRESHOLD) || 150,
    LOW_BATTERY_PERCENT: 20,
    DATA_STALE_SECONDS: 60,
    CHECKPOINT_PROXIMITY_M: parseFloat(process.env.CHECKPOINT_PROXIMITY_M) || 200,
    GPS_MATCH_TOLERANCE_M: parseFloat(process.env.GPS_MATCH_TOLERANCE_M) || 50,
  },

  // Firestore Collection Names
  COLLECTIONS: {
    USERS: "users",
    CONTAINERS: "containers",
    TRIPS: "trips",
    TRACKING_DATA: "tracking_data",
    ALERTS: "alerts",
    SECRET_ID_LOG: "secret_id_log",
  },

  // Realtime Database Paths
  RTDB_PATHS: {
    LIVE: "live",
    ACTIVE_ALERTS: "active_alerts",
    TELEMETRY: "telemetry",
  },

  // Device Data Interval
  DEVICE_DATA_INTERVAL_MS: 10000, // 10 seconds
};

module.exports = CONSTANTS;
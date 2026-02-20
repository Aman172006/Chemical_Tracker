const crypto = require("crypto");
require("dotenv").config();

// ============================================
// SECRET ID GENERATOR
// ============================================

/**
 * Generate a unique secret ID
 * Combines random bytes with hashed trip metadata
 * Returns 12-character alphanumeric string
 */
const generateSecretId = (tripId, deviceId) => {
  const timestamp = Date.now().toString();
  const salt = process.env.SECRET_SALT || "default_salt";

  // Random part (6 characters)
  const randomPart = crypto.randomBytes(3).toString("hex"); // 6 chars

  // Hash part (6 characters from SHA256)
  const hashInput = `${tripId}:${deviceId}:${timestamp}:${salt}`;
  const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
  const hashPart = hash.substring(0, 6);

  // Combine: 12 character secret ID
  const secretId = (randomPart + hashPart).toUpperCase();

  return secretId;
};

/**
 * Generate a unique trip ID
 * Format: TRIP_YYYYMMDD_XXXX
 */
const generateTripId = () => {
  const date = new Date();
  const dateStr =
    date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");

  const random = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `TRIP_${dateStr}_${random}`;
};

/**
 * Generate a unique container ID
 * Format: CONT_XXXX
 */
const generateContainerId = () => {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CONT_${random}`;
};

/**
 * Generate a unique alert ID
 * Format: ALERT_TIMESTAMP_XXXX
 */
const generateAlertId = () => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `ALERT_${timestamp}_${random}`;
};

/**
 * Validate secret ID format
 * Must be 12 characters, alphanumeric, uppercase
 */
const isValidSecretId = (secretId) => {
  if (!secretId || typeof secretId !== "string") return false;
  return /^[A-Z0-9]{12}$/.test(secretId);
};

module.exports = {
  generateSecretId,
  generateTripId,
  generateContainerId,
  generateAlertId,
  isValidSecretId,
};
const { db, admin } = require("../config/firebase");
const { generateSecretId } = require("../utils/idGenerator");
const CONSTANTS = require("../config/constants");
const logger = require("../utils/logger");

// ============================================
// SECRET ID MANAGEMENT SERVICE
// ============================================

/**
 * Create a new secret ID for a trip
 * - Generates new ID
 * - Expires the old ID
 * - Stores in database
 * - Updates trip document
 */
const createNewSecretId = async (tripId, deviceId, location) => {
  try {
    // Generate new secret ID
    const newSecretId = generateSecretId(tripId, deviceId);
    const now = Date.now();

    // Expire all previous active IDs for this trip
    const activeIds = await db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .where("tripId", "==", tripId)
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();

    activeIds.forEach((doc) => {
      batch.update(doc.ref, {
        isActive: false,
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Create new secret ID document
    const secretIdDoc = {
      secretId: newSecretId,
      tripId: tripId,
      deviceId: deviceId,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedAtMs: now,
      location: location || { lat: 0, lng: 0 },
      isActive: true,
      expiredAt: null,
      accessedBy: [],
      accessLog: [],
    };

    const secretIdRef = db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .doc();
    batch.set(secretIdRef, secretIdDoc);

    // Update trip with current secret ID
    const tripRef = db.collection(CONSTANTS.COLLECTIONS.TRIPS).doc(tripId);
    batch.update(tripRef, {
      currentSecretId: newSecretId,
      lastSecretIdGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSecretIdLocation: location || { lat: 0, lng: 0 },
    });

    // Commit all changes
    await batch.commit();

    logger.info(
      `New secret ID generated for trip ${tripId}: ${newSecretId}`
    );

    return {
      secretId: newSecretId,
      generatedAt: now,
      location: location,
    };
  } catch (error) {
    logger.error("Secret ID generation failed:", error.message);
    throw error;
  }
};

/**
 * Validate a secret ID for a trip
 * Returns { valid, tripId, message }
 */
const validateSecretId = async (secretId) => {
  try {
    if (!secretId) {
      return { valid: false, tripId: null, message: "Secret ID is required" };
    }

    // Find this secret ID in database
    const idSnapshot = await db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .where("secretId", "==", secretId.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (idSnapshot.empty) {
      return {
        valid: false,
        tripId: null,
        message: "Invalid or expired Secret ID. Contact the owner for new ID.",
      };
    }

    const idData = idSnapshot.docs[0].data();

    // Check if the trip is still active
    const tripDoc = await db
      .collection(CONSTANTS.COLLECTIONS.TRIPS)
      .doc(idData.tripId)
      .get();

    if (!tripDoc.exists) {
      return { valid: false, tripId: null, message: "Trip not found" };
    }

    const tripData = tripDoc.data();

    if (
      tripData.status !== CONSTANTS.TRIP_STATUS.ACTIVE &&
      tripData.status !== CONSTANTS.TRIP_STATUS.CREATED
    ) {
      return {
        valid: false,
        tripId: idData.tripId,
        message: `Trip is ${tripData.status}. Tracking not available.`,
      };
    }

    return {
      valid: true,
      tripId: idData.tripId,
      message: "Secret ID is valid",
      trip: tripData,
    };
  } catch (error) {
    logger.error("Secret ID validation failed:", error.message);
    return { valid: false, tripId: null, message: "Validation failed" };
  }
};

/**
 * Log access to a secret ID (when receiver views tracking)
 */
const logSecretIdAccess = async (secretId, userId, ipAddress) => {
  try {
    const idSnapshot = await db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .where("secretId", "==", secretId.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!idSnapshot.empty) {
      const docRef = idSnapshot.docs[0].ref;
      await docRef.update({
        accessedBy: admin.firestore.FieldValue.arrayUnion(userId),
        accessLog: admin.firestore.FieldValue.arrayUnion({
          userId: userId,
          accessedAt: Date.now(),
          ipAddress: ipAddress || "unknown",
        }),
      });
    }
  } catch (error) {
    logger.error("Secret ID access logging failed:", error.message);
  }
};

/**
 * Get all secret IDs for a trip (owner only)
 */
const getTripSecretIds = async (tripId) => {
  try {
    const snapshot = await db
      .collection(CONSTANTS.COLLECTIONS.SECRET_ID_LOG)
      .where("tripId", "==", tripId)
      .get();

    const ids = [];
    snapshot.forEach((doc) => {
      ids.push({ logId: doc.id, ...doc.data() });
    });

    // Sort by generatedAtMs descending (in-memory to avoid composite index)
    ids.sort((a, b) => (b.generatedAtMs || 0) - (a.generatedAtMs || 0));

    return ids;
  } catch (error) {
    logger.error("Get trip secret IDs failed:", error.message);
    return [];
  }
};

module.exports = {
  createNewSecretId,
  validateSecretId,
  logSecretIdAccess,
  getTripSecretIds,
};
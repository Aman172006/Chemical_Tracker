console.log("   📦 firebase.js: Loading...");

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// ============================================
// CHECK SERVICE ACCOUNT KEY EXISTS
// ============================================
const serviceAccountPath = path.resolve(
  __dirname,
  "serviceAccountKey.json"
);

console.log("   📂 Looking for service account at:", serviceAccountPath);

// Check if file exists BEFORE trying to require it
if (!fs.existsSync(serviceAccountPath)) {
  console.error("\n❌ ERROR: serviceAccountKey.json NOT FOUND!");
  console.error("   Expected location:", serviceAccountPath);
  console.error("");
  console.error("   TO FIX THIS:");
  console.error("   1. Go to Firebase Console → Project Settings → Service Accounts");
  console.error("   2. Click 'Generate new private key'");
  console.error("   3. Download the JSON file");
  console.error("   4. Rename it to: serviceAccountKey.json");
  console.error("   5. Place it in: backend\\src\\config\\");
  console.error("");
  process.exit(1);
}

// Load the service account
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
  console.log("   ✅ Service account key loaded successfully");
  console.log("   📋 Project ID from key:", serviceAccount.project_id);
} catch (error) {
  console.error("❌ ERROR: serviceAccountKey.json is INVALID:", error.message);
  process.exit(1);
}

// ============================================
// INITIALIZE FIREBASE ADMIN
// ============================================
let db, rtdb, auth;

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  console.log("   ✅ Firebase Admin SDK initialized");

  // Database References
  db = admin.firestore();
  rtdb = admin.database();
  auth = admin.auth();
  console.log("   ✅ Database references created");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  process.exit(1);
}

// ============================================
// CONNECTION TEST FUNCTION
// ============================================
const testFirebaseConnection = async () => {
  try {
    // Test Firestore
    console.log("   🔄 Testing Firestore...");
    const testRef = db.collection("_connection_test").doc("test");
    await testRef.set({
      message: "Backend connected successfully",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    await testRef.delete();
    console.log("   ✅ Firestore connected successfully");

    // Test Realtime Database
    console.log("   🔄 Testing Realtime Database...");
    const rtdbTestRef = rtdb.ref("_connection_test");
    await rtdbTestRef.set({
      message: "Backend connected",
      timestamp: Date.now(),
    });
    await rtdbTestRef.remove();
    console.log("   ✅ Realtime Database connected successfully");

    return true;
  } catch (error) {
    console.error("❌ Firebase connection test failed:", error.message);
    console.error("   Full error:", error);
    return false;
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  admin,
  db,
  rtdb,
  auth,
  testFirebaseConnection,
};

console.log("   📦 firebase.js: Complete\n");
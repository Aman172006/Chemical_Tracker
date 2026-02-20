// ============================================
// SIMPLE LOGGER UTILITY
// ============================================

const logger = {
  info: (message, data = "") => {
    console.log(`[${new Date().toISOString()}] ℹ️  INFO: ${message}`, data);
  },

  success: (message, data = "") => {
    console.log(`[${new Date().toISOString()}] ✅ SUCCESS: ${message}`, data);
  },

  warn: (message, data = "") => {
    console.warn(`[${new Date().toISOString()}] ⚠️  WARN: ${message}`, data);
  },

  error: (message, data = "") => {
    console.error(`[${new Date().toISOString()}] ❌ ERROR: ${message}`, data);
  },

  debug: (message, data = "") => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[${new Date().toISOString()}] 🐛 DEBUG: ${message}`, data);
    }
  },

  device: (deviceId, message, data = "") => {
    console.log(
      `[${new Date().toISOString()}] 📡 DEVICE [${deviceId}]: ${message}`,
      data
    );
  },

  alert: (type, message, data = "") => {
    console.log(
      `[${new Date().toISOString()}] 🚨 ALERT [${type}]: ${message}`,
      data
    );
  },
};

module.exports = logger;
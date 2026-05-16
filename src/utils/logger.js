/**
 * Professional Logger Utility
 */
export const Logger = {
  _prefix: '[JinaClip]',

  info(message, ...args) {
    console.info(`${this._prefix} ℹ️ ${message}`, ...args);
  },

  warn(message, ...args) {
    console.warn(`${this._prefix} ⚠️ ${message}`, ...args);
  },

  error(message, error = null) {
    console.error(`${this._prefix} ❌ ${message}`);
    if (error) {
      console.error(error);
    }
  },

  debug(message, ...args) {
    // You can toggle this based on an 'isDev' flag later
    console.log(`${this._prefix} 🔍 [DEBUG] ${message}`, ...args);
  }
};

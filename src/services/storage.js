import { defaultSettings } from '../config/defaultSettings.js';

/**
 * Service to handle Chrome extension storage operations.
 */
export const StorageService = {
  /**
   * Retrieves all settings, merging with defaults.
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const { settings = {} } = await chrome.storage.sync.get('settings');
    return { ...defaultSettings(), ...settings };
  },

  /**
   * Updates settings in sync storage.
   * @param {Object} settings 
   */
  async setSettings(settings) {
    await chrome.storage.sync.set({ settings });
  },

  /**
   * Resets settings to defaults.
   */
  async resetSettings() {
    await chrome.storage.sync.set({ settings: defaultSettings() });
  }
};

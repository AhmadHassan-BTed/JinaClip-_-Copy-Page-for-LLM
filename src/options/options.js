import { StorageService } from '../services/storage.js';
import { OPTION_FIELDS, OPTION_CHECKBOXES, defaultSettings } from '../config/defaultSettings.js';

/**
 * Options Page Controller
 */
const OptionsPage = {
  async init() {
    this.setupEventListeners();
    await this.loadCurrentSettings();
  },

  setupEventListeners() {
    const form = document.getElementById('settingsForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => this.handleReset());
  },

  async loadCurrentSettings() {
    const settings = await StorageService.getSettings();
    this.renderSettings(settings);
  },

  renderSettings(settings) {
    for (const key of OPTION_FIELDS) {
      const element = document.getElementById(key);
      if (!element) continue;

      if (OPTION_CHECKBOXES.has(key)) {
        element.checked = !!settings[key];
      } else {
        element.value = settings[key] ?? '';
      }
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const settings = this.getSettingsFromForm();
    await StorageService.setSettings(settings);
    this.showStatus('✓ Settings saved');
  },

  async handleReset() {
    if (confirm('Are you sure you want to reset all settings?')) {
      await StorageService.resetSettings();
      this.renderSettings(defaultSettings());
      this.showStatus('✓ Reset to defaults');
    }
  },

  getSettingsFromForm() {
    const settings = {};
    for (const key of OPTION_FIELDS) {
      const element = document.getElementById(key);
      if (!element) continue;

      settings[key] = OPTION_CHECKBOXES.has(key) ? element.checked : element.value;
    }
    // Compatibility mapping
    settings.acceptJson = settings.defaultJsonMode;
    return settings;
  },

  showStatus(text) {
    const banner = document.getElementById('savedBanner');
    banner.textContent = text;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2500);
  }
};

// Start the options page logic
document.addEventListener('DOMContentLoaded', () => OptionsPage.init());

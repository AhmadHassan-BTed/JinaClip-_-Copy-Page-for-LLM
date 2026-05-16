import { STATUS_BADGE } from '../config/constants.js';

/**
 * Utility to manage extension notifications and UI states.
 */
export const NotificationUtil = {
  /**
   * Sets the badge status on the extension icon.
   * @param {number} tabId 
   * @param {'FETCHING'|'SUCCESS'|'ERROR'} type 
   */
  setBadge(tabId, type) {
    const config = STATUS_BADGE[type];
    if (!config) return;

    chrome.action.setBadgeText({ text: config.text, tabId });
    chrome.action.setBadgeBackgroundColor({ color: config.color, tabId });

    if (type === 'SUCCESS' || type === 'ERROR') {
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
      }, 3000);
    }
  },

  /**
   * Shows a standard desktop notification.
   * @param {string} title 
   * @param {string} message 
   */
  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title,
      message,
      priority: 2
    });
  }
};

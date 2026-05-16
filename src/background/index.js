import { JinaApiService } from '../services/jinaApi.js';
import { StorageService } from '../services/storage.js';
import { NotificationUtil } from '../utils/notifications.js';
import { ContextMenuManager } from './contextMenus.js';
import { copyToClipboard } from '../utils/clipboard.js';

/**
 * Main Application Logic
 */

// Initialize context menus on install/startup
chrome.runtime.onInstalled.addListener(() => {
  ContextMenuManager.init();
});

// 1. Extension Click Handler (Direct Copy)
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.url) {
    await processAndCopy(tab.url, tab.id, {});
  }
});

// 2. Keyboard Shortcut Handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      await processAndCopy(tab.url, tab.id, {});
    }
  }
});

// 3. Context Menu Click Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url) return;

  const overrides = mapMenuIdToOptions(info.menuItemId);
  if (overrides === 'SETTINGS') {
    chrome.runtime.openOptionsPage();
    return;
  }

  await processAndCopy(tab.url, tab.id, overrides);
});

/**
 * Core Orchestrator: Fetches from Jina and copies to clipboard.
 */
async function processAndCopy(url, tabId, overrides = {}) {
  try {
    NotificationUtil.setBadge(tabId, 'FETCHING');

    const settings = await StorageService.getSettings();
    const config = { ...settings, ...overrides };

    const content = await JinaApiService.fetchContent(url, config);

    // Inject script to copy to clipboard (Chrome requires tab context for navigator.clipboard)
    await chrome.scripting.executeScript({
      target: { tabId },
      func: copyToClipboard,
      args: [content],
    });

    NotificationUtil.setBadge(tabId, 'SUCCESS');
  } catch (error) {
    console.error('JinaClip Error:', error);
    NotificationUtil.setBadge(tabId, 'ERROR');
    NotificationUtil.showNotification('Copy Failed', error.message);
  }
}

/**
 * Maps Context Menu IDs to specific Jina API overrides.
 */
function mapMenuIdToOptions(id) {
  const map = {
    'fmt_markdown': { respondWith: 'markdown' },
    'fmt_html':     { respondWith: 'html' },
    'fmt_text':     { respondWith: 'text' },
    'fmt_screenshot': { respondWith: 'screenshot' },
    'fmt_pageshot': { respondWith: 'pageshot' },
    'fmt_json':     { acceptJson: true },
    'eng_auto':     { engine: 'auto' },
    'eng_browser':  { engine: 'browser' },
    'eng_curl':     { engine: 'curl' },
    'img_all':      { retainImages: 'all' },
    'img_none':     { retainImages: 'none' },
    'img_alt':      { retainImages: 'alt' },
    'img_generated_alt': { generatedAlt: true },
    'adv_iframe':   { withIframe: true },
    'adv_shadow':   { withShadowDom: true },
    'open_settings': 'SETTINGS'
  };
  return map[id] || {};
}

import { JinaApiService } from '../services/jinaApi.js';
import { StorageService } from '../services/storage.js';
import { NotificationUtil } from '../utils/notifications.js';
import { ContextMenuManager } from './contextMenus.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { Logger } from '../utils/logger.js';

/**
 * Main Application Lifecycle
 */
Logger.info('Service Worker initializing...');

// Initialize context menus on install/startup
chrome.runtime.onInstalled.addListener((details) => {
  Logger.info(`Extension installed/updated. Reason: ${details.reason}`);
  ContextMenuManager.init();
});

// Also ensure menus are created on startup (backup)
chrome.runtime.onStartup.addListener(() => {
  Logger.info('Browser started. Refreshing context menus...');
  ContextMenuManager.init();
});

// 1. Extension Click Handler (Direct Copy)
chrome.action.onClicked.addListener(async (tab) => {
  Logger.info('Extension icon clicked for tab:', tab.id);
  if (tab?.url) {
    await processAndCopy(tab.url, tab.id, {});
  } else {
    Logger.warn('No URL found for active tab.');
  }
});

// 2. Keyboard Shortcut Handler
chrome.commands.onCommand.addListener(async (command) => {
  Logger.info(`Command received: ${command}`);
  if (command === 'copy-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      await processAndCopy(tab.url, tab.id, {});
    }
  }
});

// 3. Context Menu Click Handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  Logger.info(`Context menu item clicked: ${info.menuItemId}`);
  if (!tab?.url) {
    Logger.warn('No tab URL found for context menu action.');
    return;
  }

  const overrides = mapMenuIdToOptions(info.menuItemId);
  if (overrides === 'SETTINGS') {
    Logger.info('Opening options page...');
    chrome.runtime.openOptionsPage();
    return;
  }

  Logger.debug('Applying overrides from context menu:', overrides);
  await processAndCopy(tab.url, tab.id, overrides);
});

/**
 * Core Orchestrator: Fetches from Jina and copies to clipboard.
 */
async function processAndCopy(url, tabId, overrides = {}) {
  try {
    Logger.info(`Starting Jina transformation for: ${url}`);
    NotificationUtil.setBadge(tabId, 'FETCHING');

    const settings = await StorageService.getSettings();
    const config = { ...settings, ...overrides };
    Logger.debug('Resolved configuration:', config);

    const content = await JinaApiService.fetchContent(url, config);
    Logger.info(`Successfully fetched content. Length: ${content.length} characters.`);

    // Inject script to copy to clipboard
    Logger.debug('Injecting clipboard script into tab:', tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      func: copyToClipboard,
      args: [content],
    });

    Logger.info('Content successfully copied to clipboard.');
    NotificationUtil.setBadge(tabId, 'SUCCESS');
  } catch (error) {
    Logger.error('Transformation process failed', error);
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

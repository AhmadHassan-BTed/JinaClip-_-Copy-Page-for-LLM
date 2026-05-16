import { LocalReaderService } from '../services/localReader.js';
import { StorageService } from '../services/storage.js';
import { NotificationUtil } from '../utils/notifications.js';
import { ContextMenuManager } from './contextMenus.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { Logger } from '../utils/logger.js';

/**
 * Main Application Lifecycle
 */
Logger.info('Local Engine initializing...');

chrome.runtime.onInstalled.addListener(() => {
  ContextMenuManager.init();
});

chrome.runtime.onStartup.addListener(() => {
  ContextMenuManager.init();
});

// 1. Extension Click Handler
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.url) await processAndCopy(tab.id, {});
});

// 2. Keyboard Shortcut Handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) await processAndCopy(tab.id, {});
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

  await processAndCopy(tab.id, overrides);
});

/**
 * Core Orchestrator: Pure Local Jina Replication
 */
async function processAndCopy(tabId, overrides = {}) {
  try {
    NotificationUtil.setBadge(tabId, 'FETCHING');

    const settings = await StorageService.getSettings();
    const config = { ...settings, ...overrides };

    const content = await LocalReaderService.parsePage(tabId, config);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: copyToClipboard,
      args: [content],
    });

    Logger.info('Success! Page processed locally with full Jina-parity.');
    NotificationUtil.setBadge(tabId, 'SUCCESS');
  } catch (error) {
    Logger.error('Processing failed', error);
    NotificationUtil.setBadge(tabId, 'ERROR');
    NotificationUtil.showNotification('Copy Failed', error.message);
  }
}

/**
 * Maps Context Menu IDs to Local Engine overrides.
 */
function mapMenuIdToOptions(id) {
  const map = {
    'fmt_markdown': { respondWith: 'markdown' },
    'fmt_text':     { respondWith: 'text' },
    'fmt_screenshot': { respondWith: 'screenshot' },
    'fmt_json':     { respondWith: 'json' },
    'img_all':      { retainImages: 'all' },
    'img_none':     { retainImages: 'none' },
    'img_alt':      { retainImages: 'alt' },
    'lnk_all':      { retainLinks: 'all' },
    'lnk_none':     { retainLinks: 'none' },
    'lnk_text':     { retainLinks: 'text' },
    'sum_links':    { withLinksSummary: true },
    'sum_links_all':{ withLinksSummaryAll: true },
    'sum_images':   { withImagesSummary: true },
    'open_settings': 'SETTINGS'
  };
  return map[id] || {};
}

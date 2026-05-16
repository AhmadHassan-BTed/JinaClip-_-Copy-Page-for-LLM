import { JinaApiService } from '../services/jinaApi.js';
import { LocalReaderService } from '../services/localReader.js';
import { StorageService } from '../services/storage.js';
import { NotificationUtil } from '../utils/notifications.js';
import { ContextMenuManager } from './contextMenus.js';
import { copyToClipboard } from '../utils/clipboard.js';
import { Logger } from '../utils/logger.js';

/**
 * Main Application Lifecycle
 */
Logger.info('Service Worker initializing...');

chrome.runtime.onInstalled.addListener((details) => {
  Logger.info(`Extension installed/updated. Reason: ${details.reason}`);
  ContextMenuManager.init();
});

chrome.runtime.onStartup.addListener(() => {
  Logger.info('Browser started. Refreshing context menus...');
  ContextMenuManager.init();
});

// 1. Extension Click Handler (Direct Copy)
chrome.action.onClicked.addListener(async (tab) => {
  Logger.info('Extension icon clicked.');
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
 * Core Orchestrator: Chooses between Local and Cloud engines.
 */
async function processAndCopy(url, tabId, overrides = {}) {
  try {
    NotificationUtil.setBadge(tabId, 'FETCHING');

    const settings = await StorageService.getSettings();
    const config = { ...settings, ...overrides };
    
    // Determine engine: Defaults to local unless explicitly overridden or set in settings
    const useCloud = (config.preferredEngine === 'jina' || overrides.engineChoice === 'jina');
    
    let content;
    if (useCloud) {
      Logger.info('Using Jina Cloud Engine...');
      content = await JinaApiService.fetchContent(url, config);
    } else {
      Logger.info('Using Free Local Engine...');
      content = await LocalReaderService.parsePage(tabId);
    }

    // Inject script to copy to clipboard
    await chrome.scripting.executeScript({
      target: { tabId },
      func: copyToClipboard,
      args: [content],
    });

    Logger.info('Success! Content copied to clipboard.');
    NotificationUtil.setBadge(tabId, 'SUCCESS');
  } catch (error) {
    Logger.error('Transformation failed', error);
    NotificationUtil.setBadge(tabId, 'ERROR');
    NotificationUtil.showNotification('Copy Failed', error.message);
  }
}

/**
 * Maps Context Menu IDs to specific Jina API overrides.
 */
function mapMenuIdToOptions(id) {
  const map = {
    'engine_local': { engineChoice: 'local' },
    'engine_jina':  { engineChoice: 'jina' },
    'fmt_markdown': { respondWith: 'markdown', engineChoice: 'jina' },
    'fmt_html':     { respondWith: 'html', engineChoice: 'jina' },
    'fmt_text':     { respondWith: 'text', engineChoice: 'jina' },
    'fmt_screenshot': { respondWith: 'screenshot', engineChoice: 'jina' },
    'fmt_pageshot': { respondWith: 'pageshot', engineChoice: 'jina' },
    'fmt_json':     { acceptJson: true, engineChoice: 'jina' },
    'open_settings': 'SETTINGS'
  };
  return map[id] || {};
}

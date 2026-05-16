import { LocalReaderService } from '../services/localReader.js';
import { Logger } from '../utils/logger.js';

/**
 * Main Application Lifecycle (v7 Integration)
 * All logic is now delegated to the advanced LocalReaderService.
 */
Logger.info('Jina Reader (Local v7) initializing...');

// ── 1. Lifecycle Events ───────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  Logger.info(`Extension installed/updated: ${details.reason}`);
  LocalReaderService.setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  LocalReaderService.setupContextMenus();
});

// ── 2. Click & Keyboard Events ────────────────────────────────────────────

// Left-click on extension icon -> Quick Markdown Copy
chrome.action.onClicked.addListener((tab) => {
  LocalReaderService.handleIconClick(tab);
});

// Keyboard Shortcut (Alt+Shift+J) -> Quick Markdown Copy
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) LocalReaderService.handleIconClick(tab);
  }
});

// ── 3. Context Menu Events ────────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener((info, tab) => {
  LocalReaderService.handleContextMenuClick(info, tab);
});

import { CONTEXT_MENUS } from '../config/constants.js';
import { Logger } from '../utils/logger.js';

export const ContextMenuManager = {
  init() {
    Logger.info('Initializing context menus...');
    chrome.contextMenus.removeAll(() => {
      Logger.debug('Existing menus removed. Creating new menus...');
      let count = 0;
      for (const item of CONTEXT_MENUS) {
        const config = {
          id: item.id,
          title: item.title,
          contexts: ['action', 'page'],
        };
        if (item.parentId) config.parentId = item.parentId;
        if (item.type) config.type = item.type;
        
        chrome.contextMenus.create(config, () => {
          if (chrome.runtime.lastError) {
            Logger.error(`Failed to create menu item: ${item.id}`, chrome.runtime.lastError);
          }
        });
        count++;
      }
      Logger.info(`Context menu initialization complete. ${count} items processed.`);
    });
  }
};

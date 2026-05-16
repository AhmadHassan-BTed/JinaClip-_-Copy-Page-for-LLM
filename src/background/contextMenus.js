import { CONTEXT_MENUS } from '../config/constants.js';

export const ContextMenuManager = {
  init() {
    chrome.contextMenus.removeAll(() => {
      for (const item of CONTEXT_MENUS) {
        const config = {
          id: item.id,
          title: item.title,
          contexts: ['action'],
        };
        if (item.parentId) config.parentId = item.parentId;
        if (item.type) config.type = item.type;
        chrome.contextMenus.create(config);
      }
    });
  }
};

import { Logger } from '../utils/logger.js';

/**
 * Advanced Local Jina Engine (v4 - Extreme Reliability)
 */
export const LocalReaderService = {
  async parsePage(tabId, config) {
    Logger.info(`Local Engine (v4) initiating for tab ${tabId}...`);

    try {
      // 1. Handle Screenshots
      if (config.respondWith === 'screenshot' || config.respondWith === 'pageshot') {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        return `![Screenshot](${dataUrl})`;
      }

      // 2. Execute Local Parser
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: _engineCoreBody,
        args: [config]
      });

      Logger.debug('Raw results from script injection:', results);

      if (!results || !results[0] || results[0].result === undefined) {
        throw new Error('The browser returned an empty result. Please try refreshing the webpage you want to copy.');
      }

      const output = results[0].result;
      
      // If the engine itself returned an error object
      if (output.error) {
        throw new Error(`Parser Error: ${output.error}`);
      }

      if (config.respondWith === 'json') {
        return JSON.stringify(output, null, 2);
      }

      return output.content || '# No Content Extracted';
    } catch (err) {
      Logger.error('Local Engine v4 Error:', err);
      throw err;
    }
  }
};

/**
 * This function is converted to a string and injected into the page.
 * It MUST be self-contained.
 */
function _engineCoreBody(cfg) {
  console.log('[LocalReader] Core engine starting inside page context...');
  
  try {
    const title = document.title || 'Untitled Page';
    const url = window.location.href;
    const timestamp = new Date().toISOString();

    // 1. Find Root
    let root = document.querySelector('article') || 
               document.querySelector('main') || 
               document.querySelector('.content') ||
               document.body;

    if (!root) {
      console.warn('[LocalReader] No body or content found.');
      return { error: 'Document body not found. Is the page loaded?' };
    }

    const clone = root.cloneNode(true);

    // 2. Clean
    const blacklist = ['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'aside', '.ads'];
    blacklist.forEach(s => {
      clone.querySelectorAll(s).forEach(el => el.remove());
    });

    if (cfg.removeSelector) {
      cfg.removeSelector.split(',').forEach(s => {
        try { clone.querySelectorAll(s.trim()).forEach(el => el.remove()); } catch(e) {}
      });
    }

    // 3. Simple Markdown Converter
    function toMd(node) {
      let md = '';
      for (let child of node.childNodes) {
        if (child.nodeType === 3) md += child.textContent;
        else if (child.nodeType === 1) {
          const tag = child.tagName.toLowerCase();
          const inner = toMd(child);
          switch(tag) {
            case 'h1': md += `\n# ${inner}\n`; break;
            case 'h2': md += `\n## ${inner}\n`; break;
            case 'h3': md += `\n### ${inner}\n`; break;
            case 'p':  md += `\n${inner}\n`; break;
            case 'a':  md += (cfg.retainLinks === 'none' ? '' : `[${inner}](${child.href})`); break;
            case 'img': md += (cfg.retainImages === 'none' ? '' : `![${child.alt || 'img'}](${child.src})`); break;
            case 'li':  md += `* ${inner}\n`; break;
            case 'code': md += `\`${inner}\``; break;
            case 'br': md += '\n'; break;
            default: md += inner;
          }
        }
      }
      return md;
    }

    const mainContent = toMd(clone).trim() || '_(No readable text content found)_';
    const fullMarkdown = `# ${title}\n\nURL: ${url}\n\n${mainContent}`;

    console.log('[LocalReader] Extraction successful.');
    return {
      title,
      url,
      timestamp,
      content: fullMarkdown
    };
  } catch (e) {
    console.error('[LocalReader] Critical Error:', e);
    return { error: e.message };
  }
}

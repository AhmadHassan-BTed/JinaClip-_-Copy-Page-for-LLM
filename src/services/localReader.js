import { Logger } from '../utils/logger.js';

/**
 * Service to process webpages locally without any external API calls.
 */
export const LocalReaderService = {
  /**
   * Processes the active tab's content into Markdown locally.
   * @param {number} tabId 
   * @returns {Promise<string>}
   */
  async parsePage(tabId) {
    Logger.info('Executing local parsing logic...');

    // 1. Inject the parser script into the page
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: this._extractAndConvert
    });

    const content = results[0].result;
    if (!content) {
      throw new Error('Local parser failed to extract content from this page.');
    }

    return content;
  },

  /**
   * This function runs INSIDE the webpage context.
   * It uses a simplified version of Readability/Turndown logic.
   * @private
   */
  _extractAndConvert() {
    // A. Simplified Readability logic (removing noise)
    const selectorsToRemove = [
      'script', 'style', 'noscript', 'iframe', 'nav', 'footer', 
      'header', 'aside', '.ads', '.sidebar', '.menu', '.social-share'
    ];
    
    const clone = document.cloneNode(true);
    selectorsToRemove.forEach(s => {
      clone.querySelectorAll(s).forEach(el => el.remove());
    });

    // B. Get the "Main" content
    // We look for common article containers, fallback to body
    const main = clone.querySelector('article, main, .content, .post, #content') || clone.body;

    // C. Very basic HTML to Markdown converter (Native JS)
    // In a full production app, we would bundle Turndown.js here.
    // For now, we'll use a robust recursive cleaner.
    
    function toMarkdown(node) {
      let text = '';
      for (let child of node.childNodes) {
        if (child.nodeType === 3) { // Text
          text += child.textContent;
        } else if (child.nodeType === 1) { // Element
          const tag = child.tagName.toLowerCase();
          const inner = toMarkdown(child);
          
          switch(tag) {
            case 'h1': text += `\n# ${inner}\n`; break;
            case 'h2': text += `\n## ${inner}\n`; break;
            case 'h3': text += `\n### ${inner}\n`; break;
            case 'p':  text += `\n${inner}\n`; break;
            case 'a':  text += `[${inner}](${child.href})`; break;
            case 'img': text += `![${child.alt || 'image'}](${child.src})`; break;
            case 'li':  text += `* ${inner}\n`; break;
            case 'code': text += `\`${inner}\``; break;
            case 'pre': text += `\n\`\`\`\n${inner}\n\`\`\`\n`; break;
            case 'strong': case 'b': text += `**${inner}**`; break;
            case 'em': case 'i': text += `*${inner}*`; break;
            case 'br': text += '\n'; break;
            default: text += inner;
          }
        }
      }
      return text;
    }

    const markdown = toMarkdown(main);
    const title = document.title;
    const url = window.location.href;

    return `# ${title}\n\nSource: ${url}\n\n---\n\n${markdown.trim()}`;
  }
};

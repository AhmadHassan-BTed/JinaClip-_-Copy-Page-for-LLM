import { Logger } from '../utils/logger.js';

/**
 * Advanced Local Jina Engine (v5 - Intelligence Mode)
 * Uses heuristic scoring to extract "Clean" content only.
 */
export const LocalReaderService = {
  async parsePage(tabId, config) {
    Logger.info(`Local Engine (v5) Intelligence Mode starting...`);

    try {
      if (config.respondWith === 'screenshot' || config.respondWith === 'pageshot') {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        return `![Screenshot](${dataUrl})`;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: _engineCoreBody,
        args: [config]
      });

      if (!results || !results[0] || results[0].result === undefined) {
        throw new Error('Local engine failed to extract content.');
      }

      const output = results[0].result;
      if (output.error) throw new Error(output.error);

      if (config.respondWith === 'json') return JSON.stringify(output, null, 2);
      return output.content || '# No Content Found';
    } catch (err) {
      Logger.error('Local Engine v5 Error:', err);
      throw err;
    }
  }
};

/**
 * Injected Script: Intelligence Mode
 */
function _engineCoreBody(cfg) {
  try {
    const title = document.title || 'Untitled Page';
    const url = window.location.href;
    
    // 1. Scoring Engine: Find the "best" content container
    function getBestRoot() {
      const candidates = document.querySelectorAll('div, section, article, main, table');
      let best = document.body;
      let maxScore = 0;

      candidates.forEach(el => {
        const text = el.innerText || '';
        const links = el.querySelectorAll('a').length;
        if (text.length < 100) return; // Too small

        // Score = Text length minus penalty for too many links
        // (This naturally ignores Nav bars and Link lists)
        let score = text.length / (links > 0 ? links * 0.5 : 1);
        
        // Bonus for semantic tags
        if (['article', 'main'].includes(el.tagName.toLowerCase())) score *= 2;

        if (score > maxScore) {
          maxScore = score;
          best = el;
        }
      });
      return best;
    }

    const root = cfg.targetSelector ? (document.querySelector(cfg.targetSelector) || getBestRoot()) : getBestRoot();
    const clone = root.cloneNode(true);

    // 2. Aggressive Cleaning
    const junk = [
      'script', 'style', 'nav', 'footer', 'aside', '.ads', '.sidebar', 
      '#header', '.menu', 'noscript', '.social', '.sharing'
    ];
    junk.forEach(s => clone.querySelectorAll(s).forEach(el => el.remove()));
    
    // Special: Remove tiny "utility" links like [hide], [login], [vote]
    clone.querySelectorAll('a').forEach(a => {
      if (a.innerText.trim().length < 2 && !a.querySelector('img')) a.remove();
      const text = a.innerText.toLowerCase();
      if (['hide', 'delete', 'report', 'flag', 'login'].includes(text)) a.remove();
    });

    // 3. Smart Markdown Converter
    function nodeToMd(node, depth = 0) {
      let md = '';
      const blockTags = ['p', 'div', 'section', 'article', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr'];
      
      for (let child of node.childNodes) {
        if (child.nodeType === 3) {
          md += child.textContent.replace(/\s+/g, ' ');
        } else if (child.nodeType === 1) {
          const tag = child.tagName.toLowerCase();
          let inner = nodeToMd(child, depth + 1).trim();
          if (!inner && tag !== 'img' && tag !== 'br') continue;

          switch(tag) {
            case 'h1': md += `\n# ${inner}\n`; break;
            case 'h2': md += `\n## ${inner}\n`; break;
            case 'h3': md += `\n### ${inner}\n`; break;
            case 'h4': case 'h5': case 'h6': md += `\n#### ${inner}\n`; break;
            case 'p':  md += `\n${inner}\n`; break;
            case 'a':  md += `[${inner}](${child.href})`; break;
            case 'img': md += `![${child.alt || 'img'}](${child.src})`; break;
            case 'li':  md += `\n* ${inner}`; break;
            case 'code': md += ` \`${inner}\` `; break;
            case 'pre': md += `\n\`\`\`\n${inner}\n\`\`\`\n`; break;
            case 'br': md += '\n'; break;
            case 'table': md += `\n${inner}\n`; break;
            case 'tr': md += `\n${inner}`; break;
            case 'td': case 'th': md += ` | ${inner}`; break;
            default:
              md += blockTags.includes(tag) ? `\n${inner}\n` : inner;
          }
        }
      }
      return md;
    }

    const rawMd = nodeToMd(clone);
    const cleanedMd = rawMd
      .replace(/\n{3,}/g, '\n\n') // Fix excessive spacing
      .replace(/^[ \t]+|[ \t]+$/gm, '') // Trim lines
      .trim();

    return {
      title,
      url,
      content: `# ${title}\n\nURL: ${url}\n\n${cleanedMd}`
    };
  } catch (e) {
    return { error: `Intelligence Engine Error: ${e.message}` };
  }
}

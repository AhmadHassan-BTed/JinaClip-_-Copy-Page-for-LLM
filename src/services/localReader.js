import { Logger } from '../utils/logger.js';

/**
 * Advanced Local Jina Engine (v3 - Ultra-Robust)
 */
export const LocalReaderService = {
  async parsePage(tabId, config) {
    Logger.info(`Local Engine processing...`);

    try {
      // 1. Handle Screenshots
      if (config.respondWith === 'screenshot' || config.respondWith === 'pageshot') {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        return `![Screenshot](${dataUrl})`;
      }

      // 2. Execute Local Parser with explicit timeout and error handling
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: this._engineCore,
        args: [config]
      }).catch(err => {
        Logger.error('Script injection failed:', err);
        throw new Error(`Permission Denied: Browser blocked script execution on this page. (${err.message})`);
      });

      if (!results || !results[0] || !results[0].result) {
        throw new Error('Local parser failed to retrieve content. Try refreshing the page.');
      }

      const output = results[0].result;

      if (config.respondWith === 'json') {
        return JSON.stringify(output, null, 2);
      }

      return output.content || '# No content found';
    } catch (err) {
      Logger.error('Local Engine Error:', err);
      throw err;
    }
  },

  /**
   * The core engine logic that runs inside the page.
   */
  _engineCore(cfg) {
    try {
      const title = document.title || 'Untitled Page';
      const url = window.location.href;
      const timestamp = new Date().toISOString();

      // --- 1. Targeted Extraction ---
      let root = document.querySelector('article') || document.querySelector('main') || document.body || document.documentElement;

      if (cfg.targetSelector) {
        const target = document.querySelector(cfg.targetSelector);
        if (target) root = target;
      }

      if (!root) throw new Error('Could not find content root (body/html).');

      const clone = root.cloneNode(true);

      // --- 2. Remove Unwanted Content ---
      const blacklist = ['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'aside', '.ads'];
      if (cfg.removeSelector) {
        cfg.removeSelector.split(',').forEach(s => {
          try { clone.querySelectorAll(s.trim()).forEach(el => el.remove()); } catch(e) {}
        });
      }
      blacklist.forEach(s => {
        clone.querySelectorAll(s).forEach(el => el.remove());
      });

      // --- 3. Gather Links & Images ---
      const links = [];
      const images = [];
      clone.querySelectorAll('a').forEach(a => {
        if (a.href && a.href.startsWith('http')) links.push({ text: a.innerText.trim(), url: a.href });
      });
      clone.querySelectorAll('img').forEach(img => {
        if (img.src && img.src.startsWith('http')) images.push({ alt: img.alt || 'image', src: img.src });
      });

      // --- 4. Content Conversion ---
      function nodeToMd(node) {
        let md = '';
        for (let child of node.childNodes) {
          if (child.nodeType === 3) md += child.textContent;
          else if (child.nodeType === 1) {
            const tag = child.tagName.toLowerCase();
            const inner = nodeToMd(child);
            switch(tag) {
              case 'h1': md += `\n# ${inner}\n`; break;
              case 'h2': md += `\n## ${inner}\n`; break;
              case 'h3': md += `\n### ${inner}\n`; break;
              case 'p':  md += `\n${inner}\n`; break;
              case 'a':  md += (cfg.retainLinks === 'none' ? '' : (cfg.retainLinks === 'text' ? inner : `[${inner}](${child.href})`)); break;
              case 'img': md += (cfg.retainImages === 'none' ? '' : (cfg.retainImages === 'alt' ? `![${child.alt || ''}]` : `![${child.alt || 'img'}](${child.src})`)); break;
              case 'li':  md += `* ${inner}\n`; break;
              case 'code': md += `\`${inner}\``; break;
              case 'br': md += '\n'; break;
              default: md += inner;
            }
          }
        }
        return md;
      }

      const mainContent = nodeToMd(clone).trim() || '_[No readable text found on this page]_';

      // --- 5. Generate Summaries ---
      let footers = '';
      if (cfg.withLinksSummary && links.length > 0) {
        footers += `\n\n---\n### 🔗 Links Summary\n`;
        const uniqueLinks = [...new Map(links.map(l => [l.url, l])).values()];
        uniqueLinks.forEach((l, i) => { footers += `[${i+1}] ${l.text || 'Link'}: ${l.url}\n`; });
      }

      const fullMarkdown = `# ${title}\n\nURL: ${url}\n\n${mainContent}${footers}`;

      return { title, url, timestamp, content: fullMarkdown, links, images };
    } catch (e) {
      return { content: `# Parsing Error\n${e.message}` };
    }
  }
};

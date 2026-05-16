import { Logger } from '../utils/logger.js';

/**
 * Advanced Local Jina Engine (v2)
 * Robust, null-safe replication of Jina Reader functionality.
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

      // 2. Execute Local Parser
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: this._engineCore,
        args: [config]
      });

      if (!results || !results[0] || !results[0].result) {
        throw new Error('Local parser returned no data. Ensure the page is fully loaded.');
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
      let root = document.body;
      if (cfg.targetSelector) {
        const target = document.querySelector(cfg.targetSelector);
        if (target) root = target;
      }

      if (!root) return { title, url, content: '# Error: Target element not found' };

      const clone = root.cloneNode(true);

      // --- 2. Remove Unwanted Content ---
      const defaultBlacklist = ['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'aside', '.ads'];
      
      if (cfg.removeSelector) {
        cfg.removeSelector.split(',').forEach(s => {
          try { clone.querySelectorAll(s.trim()).forEach(el => el.remove()); } catch(e) {}
        });
      }
      
      defaultBlacklist.forEach(s => {
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

      // --- 4. Simple HTML to Markdown ---
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
              case 'strong': case 'b': md += `**${inner}**`; break;
              case 'em': case 'i': md += `*${inner}*`; break;
              case 'br': md += '\n'; break;
              default: md += inner;
            }
          }
        }
        return md;
      }

      const mainContent = nodeToMd(clone).trim();

      // --- 5. Generate Summaries ---
      let footers = '';
      if (cfg.withLinksSummary || cfg.withLinksSummaryAll) {
        footers += `\n\n---\n### 🔗 Links Summary\n`;
        const uniqueLinks = cfg.withLinksSummaryAll ? links : [...new Map(links.map(l => [l.url, l])).values()];
        uniqueLinks.forEach((l, i) => { footers += `[${i+1}] ${l.text || 'Link'}: ${l.url}\n`; });
      }

      if (cfg.withImagesSummary) {
        footers += `\n\n---\n### 🖼️ Images Summary\n`;
        const uniqueImages = [...new Map(images.map(img => [img.src, img])).values()];
        uniqueImages.forEach((img, i) => { footers += `![Image ${i+1}](${img.src}) - ${img.alt}\n`; });
      }

      const fullMarkdown = `# ${title}\n\nURL: ${url}\n\n${mainContent}${footers}`;

      return { title, url, timestamp, content: fullMarkdown, links, images };
    } catch (e) {
      return { content: `# Local Parsing Error\n${e.message}` };
    }
  }
};

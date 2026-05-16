import { Logger } from '../utils/logger.js';

/**
 * Advanced Local Jina Engine
 * Replicates Jina Reader API functionality entirely in-browser.
 */
export const LocalReaderService = {
  /**
   * Main entry point for local parsing.
   */
  async parsePage(tabId, config) {
    Logger.info(`Local Engine starting with format: ${config.respondWith}`);

    // 1. Handle Screenshots (Native Chrome API)
    if (config.respondWith === 'screenshot' || config.respondWith === 'pageshot') {
      return this._takeScreenshot(tabId);
    }

    // 2. Process DOM (Injected Script)
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: this._engineCore,
      args: [config]
    });

    const output = results[0].result;

    // 3. Format Output
    if (config.respondWith === 'json') {
      return JSON.stringify(output, null, 2);
    }

    return output.content;
  },

  /**
   * Internal Screenshot Logic
   */
  async _takeScreenshot(tabId) {
    Logger.info('Capturing local screenshot...');
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    return `![Screenshot](${dataUrl})`;
  },

  /**
   * The core engine logic that runs inside the page.
   * This is where we replicate Jina's logic.
   */
  _engineCore(cfg) {
    const title = document.title;
    const url = window.location.href;
    const timestamp = new Date().toISOString();

    // --- 1. Targeted Extraction ---
    let root = document.body;
    if (cfg.targetSelector) {
      const target = document.querySelector(cfg.targetSelector);
      if (target) root = target;
    }

    const clone = root.cloneNode(true);

    // --- 2. Remove Unwanted Content ---
    const defaultBlacklist = ['script', 'style', 'noscript', 'iframe', 'nav', 'footer', 'aside'];
    if (cfg.removeSelector) {
      cfg.removeSelector.split(',').forEach(s => {
        clone.querySelectorAll(s.trim()).forEach(el => el.remove());
      });
    }
    defaultBlacklist.forEach(s => {
      clone.querySelectorAll(s).forEach(el => el.remove());
    });

    // --- 3. Gather Meta Information (Links & Images) ---
    const links = [];
    const images = [];
    
    clone.querySelectorAll('a').forEach(a => {
      if (a.href) links.push({ text: a.innerText.trim(), url: a.href });
    });
    
    clone.querySelectorAll('img').forEach(img => {
      if (img.src) images.push({ alt: img.alt || 'image', src: img.src });
    });

    // --- 4. Convert to Markdown ---
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
            case 'a':  
              if (cfg.retainLinks === 'none') break;
              md += cfg.retainLinks === 'text' ? inner : `[${inner}](${child.href})`;
              break;
            case 'img': 
              if (cfg.retainImages === 'none') break;
              md += cfg.retainImages === 'alt' ? `![${child.alt || ''}]` : `![${child.alt || 'img'}](${child.src})`;
              break;
            case 'li':  md += `* ${inner}\n`; break;
            case 'strong': case 'b': md += `**${inner}**`; break;
            case 'em': case 'i': md += `*${inner}*`; break;
            case 'code': md += `\`${inner}\``; break;
            case 'pre': md += `\n\`\`\`\n${inner}\n\`\`\`\n`; break;
            case 'br': md += '\n'; break;
            default: md += inner;
          }
        }
      }
      return md;
    }

    let mainContent = nodeToMd(clone).trim();

    // --- 5. Generate Summaries (Footers) ---
    let footers = '\n\n---\n\n';
    
    if (cfg.withLinksSummary || cfg.withLinksSummaryAll) {
      footers += `### 🔗 Links Summary\n`;
      const uniqueLinks = cfg.withLinksSummaryAll ? links : [...new Map(links.map(l => [l.url, l])).values()];
      uniqueLinks.forEach((l, i) => {
        footers += `[${i+1}] ${l.text}: ${l.url}\n`;
      });
    }

    if (cfg.withImagesSummary) {
      footers += `\n### 🖼️ Images Summary\n`;
      const uniqueImages = [...new Map(images.map(img => [img.src, img])).values()];
      uniqueImages.forEach((img, i) => {
        footers += `![Image ${i+1}](${img.src}) - ${img.alt}\n`;
      });
    }

    const fullMarkdown = `# ${title}\n\nURL: ${url}\n\n${mainContent}${footers}`;

    // Return structured object for JSON mode
    return {
      title,
      url,
      timestamp,
      content: fullMarkdown,
      links: cfg.withLinksSummary ? links : undefined,
      images: cfg.withImagesSummary ? images : undefined
    };
  }
};

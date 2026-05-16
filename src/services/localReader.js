import { Logger } from '../utils/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Configuration
// ─────────────────────────────────────────────────────────────────────────────

/** All supported respondWith modes — mirrors Jina Reader's API surface exactly. */
export const RESPOND_WITH = Object.freeze({
  MARKDOWN:   'markdown',   // Default: clean markdown
  HTML:       'html',       // Raw cleaned HTML
  TEXT:       'text',       // Plain text, no markup
  SCREENSHOT: 'screenshot', // PNG of visible viewport
  PAGESHOT:   'pageshot',   // Stitched full-page PNG
  JSON:       'json',       // Full structured JSON payload
  READER:     'reader',     // Alias for markdown (Jina compat)
});

/**
 * Context menu definitions.
 * Each entry maps to a specific Jina-compatible config.
 * Inject into background.js via setupContextMenus() + handleContextMenuClick().
 *
 * Wire-up example in background.js:
 *   import { LocalReaderService } from './services/localreader.js';
 *   chrome.runtime.onInstalled.addListener(() => LocalReaderService.setupContextMenus());
 *   chrome.contextMenus.onClicked.addListener((info, tab) => LocalReaderService.handleContextMenuClick(info, tab));
 *   chrome.action.onClicked.addListener(tab => LocalReaderService.handleIconClick(tab));
 */
export const CONTEXT_MENU_ITEMS = Object.freeze([
  // ── Core formats ────────────────────────────────────────────────────────
  {
    id: 'jina_markdown',
    title: '📄  Copy as Markdown',
    config: { respondWith: 'markdown' },
  },
  {
    id: 'jina_text',
    title: '📝  Copy as Plain Text',
    config: { respondWith: 'text' },
  },
  {
    id: 'jina_html',
    title: '🌐  Copy as Cleaned HTML',
    config: { respondWith: 'html' },
  },
  {
    id: 'jina_json',
    title: '🔧  Copy as JSON (Full Payload)',
    config: { respondWith: 'json' },
  },
  { id: 'sep_1', separator: true },

  // ── Image options ────────────────────────────────────────────────────────
  {
    id: 'jina_with_captions',
    title: '🖼️  Copy with Image Captions',
    config: { respondWith: 'markdown', withGeneratedAlt: true, retainImages: 'all' },
  },
  {
    id: 'jina_no_images',
    title: '🚫  Copy without Images',
    config: { respondWith: 'markdown', retainImages: 'none' },
  },
  {
    id: 'jina_images_summary',
    title: '📋  Copy with Images Summary',
    config: { respondWith: 'markdown', withImagesSummary: true, withGeneratedAlt: true },
  },
  { id: 'sep_2', separator: true },

  // ── Link options ─────────────────────────────────────────────────────────
  {
    id: 'jina_links_summary',
    title: '🔗  Copy with Links Summary',
    config: { respondWith: 'markdown', withLinksSummary: true },
  },
  {
    id: 'jina_links_and_images',
    title: '✨  Copy Full (Links + Image Captions)',
    config: {
      respondWith:      'markdown',
      withLinksSummary: true,
      withGeneratedAlt: true,
      withImagesSummary: true,
    },
  },
  { id: 'sep_3', separator: true },

  // ── Shadow DOM ───────────────────────────────────────────────────────────
  {
    id: 'jina_shadow_dom',
    title: '👁️  Copy (include Shadow DOM)',
    config: { respondWith: 'markdown', withShadowDom: true },
  },
  { id: 'sep_4', separator: true },

  // ── Screenshots ──────────────────────────────────────────────────────────
  {
    id: 'jina_screenshot',
    title: '📸  Screenshot — Visible Area',
    config: { respondWith: 'screenshot' },
  },
  {
    id: 'jina_pageshot',
    title: '📷  Screenshot — Full Page',
    config: { respondWith: 'pageshot' },
  },
]);

// ─────────────────────────────────────────────────────────────────────────────
// LocalReaderService
// ─────────────────────────────────────────────────────────────────────────────

export const LocalReaderService = {

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Parse the active page and return formatted content.
   *
   * @param {number} tabId  - Chrome tab ID to extract from.
   * @param {object} config - Jina-compatible extraction config.
   *
   * Supported config keys:
   *   respondWith      {string}         'markdown'|'html'|'text'|'screenshot'|'pageshot'|'json'
   *   retainImages     {string}         'all' (default) | 'none'
   *   withGeneratedAlt {boolean}        Heuristically generate alt text for images missing it
   *   withImagesSummary{boolean}        Append an Images Summary section at end
   *   withLinksSummary {boolean}        Append a Links Summary section at end
   *   withShadowDom    {boolean}        Flatten & include shadow DOM content
   *   targetSelector   {string}         CSS selector — scope extraction to this element
   *   removeSelector   {string|string[]}CSS selector(s) — remove matched elements before parse
   *   tokenBudget      {number}         Soft cap on output characters
   */
  async parsePage(tabId, config = {}) {
    const cfg = {
      respondWith:       'markdown',
      retainImages:      'all',
      withGeneratedAlt:  false,
      withImagesSummary: false,
      withLinksSummary:  false,
      withShadowDom:     false,
      tokenBudget:       null,
      ...config,
    };

    Logger.info(`[LocalReader v7] mode=${cfg.respondWith} tab=${tabId}`);

    try {
      // ── Screenshot modes ─────────────────────────────────────────────────
      if (cfg.respondWith === 'screenshot') {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        return `![Screenshot](${dataUrl})`;
      }

      if (cfg.respondWith === 'pageshot') {
        return await this._captureFullPage(tabId);
      }

      // ── Scripted extraction ──────────────────────────────────────────────
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId },
        func:   _engineCoreBody,
        args:   [cfg],
      });

      if (!result) throw new Error('Local engine returned no result.');
      if (result.error) throw new Error(result.error);

      // ── JSON mode ────────────────────────────────────────────────────────
      if (cfg.respondWith === 'json') return JSON.stringify(result, null, 2);

      // ── HTML mode ────────────────────────────────────────────────────────
      if (cfg.respondWith === 'html') return result.html ?? '';

      // ── Text mode ────────────────────────────────────────────────────────
      if (cfg.respondWith === 'text') return result.text ?? '';

      // ── Markdown / Reader mode ───────────────────────────────────────────
      const metaLines = [
        `Title: ${result.title}`,
        `URL Source: ${result.url}`,
        result.description   ? `Description: ${result.description}`       : null,
        result.publishedTime ? `Published Time: ${result.publishedTime}`  : null,
        result.author        ? `Author: ${result.author}`                 : null,
        result.language      ? `Language: ${result.language}`             : null,
        result.wordCount     ? `Word Count: ~${result.wordCount}`         : null,
      ].filter(Boolean);

      let body = result.content;

      // Optional: Images Summary
      if (cfg.withImagesSummary && result.images?.length) {
        const section = result.images
          .map((img, i) => {
            const label   = img.alt || `Image ${i + 1}`;
            const caption = img.caption ? ` — ${img.caption}` : '';
            return `${i + 1}. ![${label}](${img.src})${caption}`;
          })
          .join('\n');
        body += `\n\n## Images Summary\n\n${section}`;
      }

      // Optional: Links Summary
      if (cfg.withLinksSummary && result.links?.length) {
        const section = result.links
          .map((l, i) => `${i + 1}. [${l.text || l.href}](${l.href})`)
          .join('\n');
        body += `\n\n## Links Summary\n\n${section}`;
      }

      // Optional: token budget (soft truncation)
      if (cfg.tokenBudget && body.length > cfg.tokenBudget) {
        body = body.slice(0, cfg.tokenBudget) + '\n\n…[truncated by tokenBudget]';
      }

      return `${metaLines.join('\n')}\n\nMarkdown Content:\n${body}`;

    } catch (err) {
      Logger.error('[LocalReader v7] parsePage error:', err);
      throw err;
    }
  },

  /**
   * Parse the page and write the result directly to the clipboard.
   * Works via injected script so clipboard permission is exercised in page context.
   *
   * @param  {number} tabId
   * @param  {object} config
   * @returns {string} The text that was copied.
   */
  async copyToClipboard(tabId, config = {}) {
    const content = await this.parsePage(tabId, config);

    await chrome.scripting.executeScript({
      target: { tabId },
      func: async (text) => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Fallback for pages that block clipboard API
          const ta       = document.createElement('textarea');
          ta.value       = text;
          ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
      },
      args: [content],
    });

    Logger.info(`[LocalReader v7] Copied ${content.length} chars to clipboard.`);
    return content;
  },

  // ── Extension Integration ─────────────────────────────────────────────────

  /**
   * Register all context-menu items under the extension icon (right-click).
   * Call once from background.js inside chrome.runtime.onInstalled.addListener().
   */
  setupContextMenus() {
    // Always start fresh to avoid duplicate IDs across reloads
    chrome.contextMenus.removeAll(() => {
      // Top-level parent shown when right-clicking the extension icon
      chrome.contextMenus.create({
        id:       'jina_root',
        title:    'Jina Reader — Copy Page As…',
        contexts: ['action'],
      });

      for (const item of CONTEXT_MENU_ITEMS) {
        if (item.separator) {
          chrome.contextMenus.create({
            id:       item.id,
            type:     'separator',
            parentId: 'jina_root',
            contexts: ['action'],
          });
        } else {
          chrome.contextMenus.create({
            id:       item.id,
            title:    item.title,
            parentId: 'jina_root',
            contexts: ['action'],
          });
        }
      }

      Logger.info('[LocalReader v7] Context menus registered.');
    });
  },

  /**
   * Handle a context-menu item click.
   * Wire up in background.js:
   *   chrome.contextMenus.onClicked.addListener(
   *     (info, tab) => LocalReaderService.handleContextMenuClick(info, tab)
   *   );
   */
  async handleContextMenuClick(info, tab) {
    const item = CONTEXT_MENU_ITEMS.find(m => m.id === info.menuItemId);
    if (!item || item.separator) return;

    Logger.info(`[LocalReader v7] Menu click: ${item.id}`);

    try {
      const content = await this.copyToClipboard(tab.id, item.config);
      const size    = this._humanSize(content.length);
      await this._notify('Jina Reader', `✅ Copied! (${size})`);
    } catch (err) {
      Logger.error('[LocalReader v7] Menu click error:', err);
      await this._notify('Jina Reader — Error', `❌ ${err.message}`);
    }
  },

  /**
   * Handle left-click on the extension icon — quick copy as Markdown.
   * Wire up in background.js:
   *   chrome.action.onClicked.addListener(tab => LocalReaderService.handleIconClick(tab));
   */
  async handleIconClick(tab) {
    Logger.info(`[LocalReader v7] Icon click — quick copy for tab ${tab.id}`);
    try {
      const content = await this.copyToClipboard(tab.id, { respondWith: 'markdown' });
      const size    = this._humanSize(content.length);
      await this._notify('Jina Reader', `✅ Page copied as Markdown (${size})`);
    } catch (err) {
      Logger.error('[LocalReader v7] Icon click error:', err);
      await this._notify('Jina Reader — Error', `❌ ${err.message}`);
    }
  },

  // ── Private Helpers ───────────────────────────────────────────────────────

  /**
   * Capture the full page by scrolling and stitching visible-area screenshots
   * via an OffscreenCanvas assembled inside the extension's service worker.
   *
   * Falls back to a multi-image markdown string when canvas is unavailable.
   */
  async _captureFullPage(tabId) {
    // Get page dimensions
    const [{ result: dims }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        scrollHeight: document.documentElement.scrollHeight,
        scrollWidth:  document.documentElement.scrollWidth,
        viewHeight:   window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      }),
    });

    const { scrollHeight, viewHeight, devicePixelRatio: dpr } = dims;
    const viewports = Math.ceil(scrollHeight / viewHeight);
    const shots     = [];

    for (let i = 0; i < viewports; i++) {
      const scrollY = i * viewHeight;

      await chrome.scripting.executeScript({
        target: { tabId },
        func:   (y) => window.scrollTo({ top: y, behavior: 'instant' }),
        args:   [scrollY],
      });

      // Allow paint to settle
      await _delay(180);
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      shots.push(dataUrl);
    }

    // Restore scroll position
    await chrome.scripting.executeScript({
      target: { tabId },
      func:   () => window.scrollTo({ top: 0, behavior: 'instant' }),
    });

    // Try OffscreenCanvas stitching (MV3 service worker)
    try {
      const stitched = await _stitchScreenshots(shots, dims, dpr);
      return `![Full Page Screenshot](${stitched})`;
    } catch {
      // Fallback: return each segment as its own image
      Logger.warn('[LocalReader v7] Canvas stitch failed — returning segmented screenshots.');
      return shots.map((url, i) => `![Page Section ${i + 1}](${url})`).join('\n\n');
    }
  },

  async _notify(title, message) {
    if (!chrome.notifications?.create) return;
    chrome.notifications.create(`jina_notif_${Date.now()}`, {
      type:    'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title,
      message,
    });
  },

  _humanSize(bytes) {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers (module-private)
// ─────────────────────────────────────────────────────────────────────────────

function _delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Stitch an array of PNG dataURLs into one tall PNG via OffscreenCanvas.
 * Runs in the service-worker context (MV3).
 */
async function _stitchScreenshots(dataUrls, dims, dpr) {
  const { scrollHeight, scrollWidth } = dims;
  const canvas  = new OffscreenCanvas(scrollWidth * dpr, scrollHeight * dpr);
  const ctx     = canvas.getContext('2d');
  const viewH   = Math.round(canvas.height / dataUrls.length);
  let   offsetY = 0;

  for (const url of dataUrls) {
    const resp    = await fetch(url);
    const blob    = await resp.blob();
    const bitmap  = await createImageBitmap(blob);
    ctx.drawImage(bitmap, 0, offsetY);
    bitmap.close();
    offsetY += viewH;
  }

  const outBlob = await canvas.convertToBlob({ type: 'image/png' });
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(outBlob);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Injected Page Script — runs inside the target tab, no imports available
// ─────────────────────────────────────────────────────────────────────────────

/**
 * _engineCoreBody
 *
 * This function is serialised and injected into the target page by
 * chrome.scripting.executeScript. It has NO access to module scope.
 * Every helper must be self-contained inside this function.
 *
 * @param {object} cfg  - Same config object forwarded from parsePage().
 * @returns {object}    - Structured extraction result or { error: string }.
 */
function _engineCoreBody(cfg) {
  try {

    // ── 0. Page-level metadata ──────────────────────────────────────────────

    const title = document.title?.trim() || 'Untitled Page';
    const url   = window.location.href;

    const _meta = (sel) => document.querySelector(sel)?.content?.trim() || null;
    const _og   = (prop) => _meta(`meta[property="${prop}"]`);
    const _name = (name) => _meta(`meta[name="${name}"]`);

    const publishedTime = _og('article:published_time')
      || _og('og:article:published_time')
      || _name('date')
      || null;

    const description = _og('og:description') || _name('description') || null;

    const author =
      _name('author')
      || _og('article:author')
      || document.querySelector('[rel="author"]')?.textContent?.trim()
      || document.querySelector('.author, .byline, [itemprop="author"]')?.textContent?.trim()
      || null;

    const language = document.documentElement.lang?.trim() || _name('language') || null;

    // ── 1. Best Content Root ────────────────────────────────────────────────

    function getBestRoot() {
      // Prefer explicit semantic landmarks first
      for (const sel of ['[role="main"]', 'main', 'article']) {
        const el = document.querySelector(sel);
        if (el && (el.innerText || '').trim().length > 200) return el;
      }

      // Score all block candidates
      const candidates = document.querySelectorAll(
        'div, section, article, main, td[class], table'
      );
      let best = document.body, maxScore = -Infinity;

      for (const el of candidates) {
        const text   = (el.innerText || '').trim();
        const links  = el.querySelectorAll('a').length;
        const inputs = el.querySelectorAll('input, button, select, textarea').length;
        if (text.length < 150) continue;

        // Link-density penalty; input-density penalty
        const linkDensity = links / Math.max(text.length, 1);
        const score =
          text.length * (1 - linkDensity * 0.6) -
          inputs * 25 +
          (['article', 'main', 'section'].includes(el.tagName.toLowerCase()) ? text.length : 0);

        if (score > maxScore) { maxScore = score; best = el; }
      }
      return best;
    }

    // ── 2. Shadow DOM flattening (optional) ─────────────────────────────────

    /**
     * Flatten Shadow DOM by recursively injecting shadow content into a cloned tree.
     * This avoids mutating the original page DOM.
     */
    function flattenShadowDom(node) {
      if (!cfg.withShadowDom) return;
      
      const shadowHost = node.shadowRoot ? node : null;
      if (shadowHost) {
        const wrapper = document.createElement('div');
        wrapper.dataset.shadowHost = '1';
        wrapper.style.display = 'contents'; // Don't affect layout
        
        // We cannot clone ShadowRoot itself, so we clone its children
        for (const child of shadowHost.shadowRoot.childNodes) {
          wrapper.appendChild(child.cloneNode(true));
        }
        node.appendChild(wrapper);
      }

      // Recurse into children (including the ones we just added)
      for (const child of node.children) {
        flattenShadowDom(child);
      }
    }

    // ── 3. Clone & clean ────────────────────────────────────────────────────

    const rawRoot = cfg.targetSelector
      ? (document.querySelector(cfg.targetSelector) || getBestRoot())
      : getBestRoot();

    // Clone first, THEN flatten the clone
    const clone = rawRoot.cloneNode(true);
    flattenShadowDom(clone);

    // Default junk selectors
    const JUNK = [
      'script', 'style', 'noscript', 'svg > title',
      'nav', 'footer', 'aside', 'header nav',
      '.ads', '.advertisement', '.ad-container', '.advert',
      '.cookie-banner', '.cookie-notice', '.gdpr',
      '.popup', '.modal-overlay', '.toast',
      '.menu', '.sidebar', '.breadcrumbs',
      '.material-icons', '.material-symbols-outlined',
      '[aria-hidden="true"]',
      '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
    ];

    // User-supplied remove selectors
    const extraRemove = cfg.removeSelector
      ? (Array.isArray(cfg.removeSelector) ? cfg.removeSelector : [cfg.removeSelector])
      : [];

    for (const sel of [...JUNK, ...extraRemove]) {
      try { clone.querySelectorAll(sel).forEach(el => el.remove()); } catch { /* bad selector */ }
    }

    // Strip hidden elements
    clone.querySelectorAll('*').forEach(el => {
      const s = el.style;
      if (s && (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0')) {
        el.remove();
      }
    });

    // ── 4. Collect structured data BEFORE conversion ─────────────────────────

    const allLinks = Array.from(clone.querySelectorAll('a[href]'))
      .map(a => ({
        href: a.href,
        text: (a.innerText || a.getAttribute('aria-label') || '').trim(),
      }))
      .filter(l => l.href && !/^javascript:/i.test(l.href));

    const allImages = Array.from(clone.querySelectorAll('img'))
      .map(img => {
        const src     = img.src || img.dataset.src || img.dataset.lazySrc || '';
        const alt     = img.alt?.trim() || '';
        const title   = img.title?.trim() || '';
        const caption = img.closest('figure')?.querySelector('figcaption')?.innerText?.trim() || '';
        const context = (
          img.closest('[aria-label]')?.getAttribute('aria-label') ||
          img.parentElement?.getAttribute('title') || ''
        ).trim();

        let generatedAlt = alt;
        if (!generatedAlt && cfg.withGeneratedAlt) {
          // Heuristic: decode filename, strip extension
          const filename = src.split('/').pop().split('?')[0]
            .replace(/[-_+]/g, ' ')
            .replace(/\.[^.]{1,5}$/, '')
            .trim();
          generatedAlt = caption || title || context
            || (filename.length > 2 ? filename : `Image`);
        }

        return { src, alt: generatedAlt || alt, title, caption, context };
      })
      .filter(img => img.src);

    // ── 5. Table → Markdown ──────────────────────────────────────────────────

    function tableToMd(table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (!rows.length) return '';

      const parseRow = (row) =>
        Array.from(row.querySelectorAll('td, th'))
          .map(cell => cell.innerText.trim().replace(/\|/g, '\\|').replace(/\n+/g, ' '));

      const head     = parseRow(rows[0]);
      const divider  = head.map(() => '---');
      const bodyRows = rows.slice(1).map(parseRow);

      return '\n\n' + [head, divider, ...bodyRows]
        .map(cols => `| ${cols.join(' | ')} |`)
        .join('\n') + '\n\n';
    }

    // ── 6. Core Markdown Converter ───────────────────────────────────────────

    const retainImages = cfg.retainImages !== 'none';
    let   imgIdx       = 0;

    function nodeToMd(node, listType = null, listDepth = 0) {
      let md = '';

      for (const child of node.childNodes) {

        // ── Text node
        if (child.nodeType === 3) {
          md += child.textContent.replace(/\s+/g, ' ');
          continue;
        }

        if (child.nodeType !== 1) continue;

        const tag = child.tagName.toLowerCase();

        // ── Self-closing / replaced elements

        if (tag === 'br') {
          md += '\n';
          continue;
        }

        if (tag === 'hr') {
          md += '\n\n---\n\n';
          continue;
        }

        if (tag === 'img') {
          if (!retainImages) continue;
          imgIdx++;
          const imgData   = allImages[imgIdx - 1] || {};
          const altText   = imgData.alt || `Image ${imgIdx}`;
          const titleAttr = imgData.title ? ` "${imgData.title}"` : '';
          md += `![${altText}](${child.src || child.dataset.src || ''}${titleAttr})`;
          if (imgData.caption) md += `\n*${imgData.caption}*`;
          continue;
        }

        if (tag === 'table') {
          md += tableToMd(child);
          continue;
        }

        // ── Recurse into element
        let inner = nodeToMd(child, null, listDepth).trim();
        if (!inner) continue;

        switch (tag) {

          // Headings
          case 'h1': md += `\n\n# ${inner}\n\n`;      break;
          case 'h2': md += `\n\n## ${inner}\n\n`;     break;
          case 'h3': md += `\n\n### ${inner}\n\n`;    break;
          case 'h4': md += `\n\n#### ${inner}\n\n`;   break;
          case 'h5': md += `\n\n##### ${inner}\n\n`;  break;
          case 'h6': md += `\n\n###### ${inner}\n\n`; break;

          // Block elements
          case 'p':
            md += `\n\n${inner}\n\n`;
            break;

          case 'div':
          case 'section':
          case 'article':
          case 'header':
          case 'figure':
            md += `\n\n${inner}\n\n`;
            break;

          case 'figcaption':
            md += `\n*${inner}*\n`;
            break;

          case 'blockquote':
            md += '\n\n' +
              inner.split('\n').map(l => `> ${l}`).join('\n') +
              '\n\n';
            break;

          case 'pre': {
            const langClass = child.querySelector('code')?.className || '';
            const lang      = (langClass.match(/language-(\w+)/) || [])[1] || '';
            const code      = child.querySelector('code')?.innerText ?? child.innerText;
            md += `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
            break;
          }

          // Inline elements
          case 'a': {
            const href = child.href;
            md += href ? `[${inner}](${href})` : inner;
            break;
          }

          case 'strong':
          case 'b':        md += `**${inner}**`;      break;
          case 'em':
          case 'i':        md += `*${inner}*`;         break;
          case 'del':
          case 's':
          case 'strike':   md += `~~${inner}~~`;       break;
          case 'ins':
          case 'u':        md += `<u>${inner}</u>`;    break;
          case 'mark':     md += `==${inner}==`;       break;
          case 'sup':      md += `^${inner}^`;         break;
          case 'sub':      md += `~${inner}~`;         break;
          case 'kbd':      md += `<kbd>${inner}</kbd>`; break;
          case 'code':     md += ` \`${inner}\` `;    break;

          case 'abbr': {
            const aTitle = child.getAttribute('title');
            md += aTitle ? `${inner} (${aTitle})` : inner;
            break;
          }

          case 'time': {
            const dt = child.getAttribute('datetime');
            md += dt ? `${inner} [${dt}]` : inner;
            break;
          }

          // Lists — preserve nesting via recursion
          case 'ul':
          case 'ol': {
            let listMd = '\n';
            const items = Array.from(child.children).filter(c => c.tagName.toLowerCase() === 'li');
            items.forEach((li, i) => {
              const indent  = '  '.repeat(listDepth);
              const bullet  = tag === 'ol' ? `${i + 1}.` : '-';
              const liInner = nodeToMd(li, tag, listDepth + 1).trim();
              listMd += `${indent}${bullet} ${liInner}\n`;
            });
            md += listMd + '\n';
            break;
          }

          case 'li':
            md += inner;
            break;

          // Details / Summary (collapsible)
          case 'details':
            md += `\n\n<details>\n${inner}\n</details>\n\n`;
            break;
          case 'summary':
            md += `\n<summary>${inner}</summary>\n`;
            break;

          // Definition lists
          case 'dl':
            md += `\n\n${inner}\n\n`;
            break;
          case 'dt':
            md += `\n**${inner}**\n`;
            break;
          case 'dd':
            md += `:   ${inner}\n`;
            break;

          // Anything else: unwrap inner
          default:
            md += inner;
        }
      }

      return md;
    }

    // ── 7. Run, clean, and compute derivatives ────────────────────────────────

    const rawMd   = nodeToMd(clone);
    const content = rawMd
      .replace(/\n{4,}/g, '\n\n\n')         // max 3 consecutive newlines
      .replace(/^[ \t]+|[ \t]+$/gm, '')     // trim every line
      .replace(/\n\n\n+/g, '\n\n\n')
      .trim();

    // Plain text: strip all markdown syntax
    const text = content
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')    // images → alt text
      .replace(/\[([^\]]+)\]\([^)]+\)/g,  '$1')    // links  → label
      .replace(/`{1,3}[^`]*`{1,3}/g,      '')      // code
      .replace(/#{1,6}\s+/g,              '')       // headings
      .replace(/(\*\*|__)(.*?)\1/g,       '$2')     // bold
      .replace(/(\*|_)(.*?)\1/g,          '$2')     // italic
      .replace(/~~(.*?)~~/g,              '$1')     // strikethrough
      .replace(/^[-*+]\s+/gm,            '')        // bullets
      .replace(/^\d+\.\s+/gm,            '')        // ordered list
      .replace(/^>\s+/gm,               '')         // blockquote
      .replace(/\n{3,}/g,               '\n\n')
      .trim();

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      title,
      url,
      publishedTime,
      description,
      author,
      language,
      wordCount,
      content,          // clean markdown
      text,             // plain text
      html: clone.innerHTML,
      links:  allLinks,
      images: allImages,
    };

  } catch (e) {
    return { error: `Engine Error: ${e.message}\n${e.stack}` };
  }
}
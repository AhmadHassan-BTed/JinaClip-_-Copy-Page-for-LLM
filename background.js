// ─── Jina Reader Extension — background.js ───────────────────────────────────
// All fetch/copy logic lives here so it works even when the popup is closed.

const JINA_BASE = 'https://r.jina.ai/';

// ─── Context Menu Definitions ─────────────────────────────────────────────────
const MENUS = [
  // ── Quick actions ──
  { id: 'copy_default',       title: '⚡ Copy page (default)',         parentId: null },
  { id: 'sep1',               title: '-',                               parentId: null, type: 'separator' },

  // ── Response format ──
  { id: 'group_format',       title: '📄 Response Format',              parentId: null },
  { id: 'fmt_markdown',       title: 'Markdown (default)',              parentId: 'group_format' },
  { id: 'fmt_html',           title: 'Raw HTML',                        parentId: 'group_format' },
  { id: 'fmt_text',           title: 'Plain Text (innerText)',          parentId: 'group_format' },
  { id: 'fmt_screenshot',     title: 'Screenshot URL (viewport)',       parentId: 'group_format' },
  { id: 'fmt_pageshot',       title: 'Pageshot URL (full page)',        parentId: 'group_format' },
  { id: 'fmt_json',           title: 'JSON mode',                       parentId: 'group_format' },

  // ── Engine ──
  { id: 'group_engine',       title: '⚙️ Fetch Engine',                parentId: null },
  { id: 'eng_auto',           title: 'Auto (default)',                  parentId: 'group_engine' },
  { id: 'eng_browser',        title: 'Browser / Headless Chrome',       parentId: 'group_engine' },
  { id: 'eng_curl',           title: 'Curl (lightweight, no JS)',       parentId: 'group_engine' },

  // ── Images ──
  { id: 'group_images',       title: '🖼️ Images',                     parentId: null },
  { id: 'img_all',            title: 'Keep images with URLs (default)',  parentId: 'group_images' },
  { id: 'img_none',           title: 'Drop all images',                 parentId: 'group_images' },
  { id: 'img_alt',            title: 'Keep alt text only',             parentId: 'group_images' },
  { id: 'img_generated_alt',  title: '🤖 Generate alt captions (VLM)', parentId: 'group_images' },

  // ── Links ──
  { id: 'group_links',        title: '🔗 Links',                        parentId: null },
  { id: 'lnk_all',            title: 'Keep links with URLs (default)', parentId: 'group_links' },
  { id: 'lnk_none',           title: 'Drop all links',                 parentId: 'group_links' },
  { id: 'lnk_text',           title: 'Keep anchor text only',          parentId: 'group_links' },
  { id: 'lnk_gptoss',         title: 'GPT-OSS citation format',        parentId: 'group_links' },

  // ── Summaries ──
  { id: 'group_summaries',    title: '📋 Summaries / Footers',          parentId: null },
  { id: 'sum_links',          title: 'Append links summary footer',    parentId: 'group_summaries' },
  { id: 'sum_links_all',      title: 'Append ALL links footer',        parentId: 'group_summaries' },
  { id: 'sum_images',         title: 'Append images summary footer',   parentId: 'group_summaries' },

  // ── Timing ──
  { id: 'group_timing',       title: '⏱️ Response Timing',             parentId: null },
  { id: 'tim_html',           title: 'Return as soon as HTML lands',   parentId: 'group_timing' },
  { id: 'tim_visible',        title: 'Visible content ready',          parentId: 'group_timing' },
  { id: 'tim_mutation',       title: 'DOM mutations idle',             parentId: 'group_timing' },
  { id: 'tim_resource',       title: 'Resources idle (default)',       parentId: 'group_timing' },
  { id: 'tim_media',          title: 'Media idle',                     parentId: 'group_timing' },
  { id: 'tim_network',        title: 'Full network idle (slowest)',    parentId: 'group_timing' },

  // ── Chunking ──
  { id: 'group_chunking',     title: '✂️ Markdown Chunking',           parentId: null },
  { id: 'chk_none',           title: 'No chunking (default)',          parentId: 'group_chunking' },
  { id: 'chk_h1',             title: 'Split at H1',                    parentId: 'group_chunking' },
  { id: 'chk_h2',             title: 'Split at H1–H2',                 parentId: 'group_chunking' },
  { id: 'chk_h3',             title: 'Split at H1–H3',                 parentId: 'group_chunking' },
  { id: 'chk_h4',             title: 'Split at H1–H4',                 parentId: 'group_chunking' },
  { id: 'chk_h5',             title: 'Split at H1–H5',                 parentId: 'group_chunking' },
  { id: 'chk_s1',             title: 'Structured split S1 (coarsest)', parentId: 'group_chunking' },
  { id: 'chk_s2',             title: 'Structured split S2',            parentId: 'group_chunking' },
  { id: 'chk_s3',             title: 'Structured split S3',            parentId: 'group_chunking' },
  { id: 'chk_s4',             title: 'Structured split S4',            parentId: 'group_chunking' },
  { id: 'chk_s5',             title: 'Structured split S5 (finest)',   parentId: 'group_chunking' },

  // ── Cache ──
  { id: 'group_cache',        title: '💾 Cache',                        parentId: null },
  { id: 'cache_normal',       title: 'Use cache (default)',            parentId: 'group_cache' },
  { id: 'cache_bypass',       title: 'Bypass cache (fresh fetch)',     parentId: 'group_cache' },

  // ── Advanced ──
  { id: 'group_advanced',     title: '🔬 Advanced Options',            parentId: null },
  { id: 'adv_iframe',         title: 'Include Iframes',                parentId: 'group_advanced' },
  { id: 'adv_shadow',         title: 'Include Shadow DOM',             parentId: 'group_advanced' },

  // ── Open settings ──
  { id: 'sep2',               title: '-',                               parentId: null, type: 'separator' },
  { id: 'open_settings',      title: '⚙️ Settings…',                   parentId: null },
];

// ─── Build context menus on install ──────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    for (const m of MENUS) {
      const item = {
        id: m.id,
        title: m.title,
        contexts: ['action'],
      };
      if (m.parentId) item.parentId = m.parentId;
      if (m.type)     item.type     = m.type;
      chrome.contextMenus.create(item);
    }
  });
  // Default settings
  chrome.storage.sync.get('settings', (data) => {
    if (!data.settings) {
      chrome.storage.sync.set({ settings: defaultSettings() });
    }
  });
});

function defaultSettings() {
  return {
    apiKey:         '',
    respondWith:    'markdown',
    engine:         'auto',
    retainImages:   'all',
    retainLinks:    'all',
    generatedAlt:   false,
    withLinksSummary: false,
    withLinksSummaryAll: false,
    withImagesSummary: false,
    respondTiming:  '',
    chunking:       '',
    noCache:        false,
    maxTokens:      '',
    tokenBudget:    '',
    targetSelector: '',
    waitForSelector:'',
    removeSelector: '',
    withIframe:     false,
    withShadowDom:  false,
    chatSpaceId:    '',
    timeout:        '',
    proxyUrl:       '',
  };
}

// ─── Context menu click handler ───────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url) return;

  switch (info.menuItemId) {
    case 'copy_default':
      await fetchAndCopy(tab.url, tab.id, {});
      break;

    // Format
    case 'fmt_markdown':   await fetchAndCopy(tab.url, tab.id, { respondWith: 'markdown' }); break;
    case 'fmt_html':       await fetchAndCopy(tab.url, tab.id, { respondWith: 'html' }); break;
    case 'fmt_text':       await fetchAndCopy(tab.url, tab.id, { respondWith: 'text' }); break;
    case 'fmt_screenshot': await fetchAndCopy(tab.url, tab.id, { respondWith: 'screenshot' }); break;
    case 'fmt_pageshot':   await fetchAndCopy(tab.url, tab.id, { respondWith: 'pageshot' }); break;
    case 'fmt_json':       await fetchAndCopy(tab.url, tab.id, { acceptJson: true }); break;

    // Engine
    case 'eng_auto':    await fetchAndCopy(tab.url, tab.id, { engine: 'auto' }); break;
    case 'eng_browser': await fetchAndCopy(tab.url, tab.id, { engine: 'browser' }); break;
    case 'eng_curl':    await fetchAndCopy(tab.url, tab.id, { engine: 'curl' }); break;

    // Images
    case 'img_all':           await fetchAndCopy(tab.url, tab.id, { retainImages: 'all' }); break;
    case 'img_none':          await fetchAndCopy(tab.url, tab.id, { retainImages: 'none' }); break;
    case 'img_alt':           await fetchAndCopy(tab.url, tab.id, { retainImages: 'alt' }); break;
    case 'img_generated_alt': await fetchAndCopy(tab.url, tab.id, { generatedAlt: true }); break;

    // Links
    case 'lnk_all':    await fetchAndCopy(tab.url, tab.id, { retainLinks: 'all' }); break;
    case 'lnk_none':   await fetchAndCopy(tab.url, tab.id, { retainLinks: 'none' }); break;
    case 'lnk_text':   await fetchAndCopy(tab.url, tab.id, { retainLinks: 'text' }); break;
    case 'lnk_gptoss': await fetchAndCopy(tab.url, tab.id, { retainLinks: 'gpt-oss' }); break;

    // Summaries
    case 'sum_links':      await fetchAndCopy(tab.url, tab.id, { withLinksSummary: true }); break;
    case 'sum_links_all':  await fetchAndCopy(tab.url, tab.id, { withLinksSummaryAll: true }); break;
    case 'sum_images':     await fetchAndCopy(tab.url, tab.id, { withImagesSummary: true }); break;

    // Timing
    case 'tim_html':      await fetchAndCopy(tab.url, tab.id, { respondTiming: 'html' }); break;
    case 'tim_visible':   await fetchAndCopy(tab.url, tab.id, { respondTiming: 'visible-content' }); break;
    case 'tim_mutation':  await fetchAndCopy(tab.url, tab.id, { respondTiming: 'mutation-idle' }); break;
    case 'tim_resource':  await fetchAndCopy(tab.url, tab.id, { respondTiming: 'resource-idle' }); break;
    case 'tim_media':     await fetchAndCopy(tab.url, tab.id, { respondTiming: 'media-idle' }); break;
    case 'tim_network':   await fetchAndCopy(tab.url, tab.id, { respondTiming: 'network-idle' }); break;

    // Chunking
    case 'chk_none': await fetchAndCopy(tab.url, tab.id, { chunking: '' }); break;
    case 'chk_h1':   await fetchAndCopy(tab.url, tab.id, { chunking: 'h1' }); break;
    case 'chk_h2':   await fetchAndCopy(tab.url, tab.id, { chunking: 'h2' }); break;
    case 'chk_h3':   await fetchAndCopy(tab.url, tab.id, { chunking: 'h3' }); break;
    case 'chk_h4':   await fetchAndCopy(tab.url, tab.id, { chunking: 'h4' }); break;
    case 'chk_h5':   await fetchAndCopy(tab.url, tab.id, { chunking: 'h5' }); break;
    case 'chk_s1':   await fetchAndCopy(tab.url, tab.id, { chunking: 's1' }); break;
    case 'chk_s2':   await fetchAndCopy(tab.url, tab.id, { chunking: 's2' }); break;
    case 'chk_s3':   await fetchAndCopy(tab.url, tab.id, { chunking: 's3' }); break;
    case 'chk_s4':   await fetchAndCopy(tab.url, tab.id, { chunking: 's4' }); break;
    case 'chk_s5':   await fetchAndCopy(tab.url, tab.id, { chunking: 's5' }); break;

    // Cache
    case 'cache_normal': await fetchAndCopy(tab.url, tab.id, { noCache: false }); break;
    case 'cache_bypass': await fetchAndCopy(tab.url, tab.id, { noCache: true }); break;

    // Advanced
    case 'adv_iframe': await fetchAndCopy(tab.url, tab.id, { withIframe: true }); break;
    case 'adv_shadow': await fetchAndCopy(tab.url, tab.id, { withShadowDom: true }); break;

    // Other
    case 'open_settings':
      chrome.runtime.openOptionsPage();
      break;
  }
});

// ─── Extension icon click handler ─────────────────────────────────────────────
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.url) {
    await fetchAndCopy(tab.url, tab.id, {});
  }
});

// ─── Keyboard shortcut handler ────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'copy-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      await fetchAndCopy(tab.url, tab.id, {});
    }
  }
});

// ─── Message handler (from popup) ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_AND_COPY') {
    fetchAndCopy(msg.url, msg.tabId, msg.overrides)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((err)  => sendResponse({ ok: false, error: err.message }));
    return true; // async
  }
  if (msg.type === 'FETCH_ONLY') {
    fetchJina(msg.url, msg.overrides)
      .then((text)  => sendResponse({ ok: true, text }))
      .catch((err)  => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

// ─── Core fetch ──────────────────────────────────────────────────────────────
async function fetchAndCopy(pageUrl, tabId, overrides) {
  // Merge with stored settings
  const { settings = defaultSettings() } = await chrome.storage.sync.get('settings');
  const cfg = { ...settings, ...overrides };

  notify(tabId, 'fetching');

  let text;
  try {
    text = await fetchJina(pageUrl, cfg);
  } catch (e) {
    notify(tabId, 'error', e.message);
    throw e;
  }

  // Copy to clipboard via offscreen document approach
  // Service workers can't access clipboard directly — delegate to content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: copyToClipboard,
      args: [text],
    });
    notify(tabId, 'done', `${(text.length / 1000).toFixed(1)} KB copied`);
  } catch (e) {
    notify(tabId, 'error', 'Clipboard write failed: ' + e.message);
    throw e;
  }
  return text;
}

async function fetchJina(pageUrl, cfg) {
  const jinaUrl = JINA_BASE + pageUrl;
  const headers = buildHeaders(cfg);
  const res = await fetch(jinaUrl, { headers });
  if (!res.ok) {
    throw new Error(`Jina returned ${res.status} ${res.statusText}`);
  }
  if (cfg.acceptJson) {
    const json = await res.json();
    return JSON.stringify(json, null, 2);
  }
  return res.text();
}

function buildHeaders(cfg) {
  const h = {};

  if (cfg.apiKey)        h['Authorization']      = `Bearer ${cfg.apiKey}`;
  if (cfg.respondWith && cfg.respondWith !== 'markdown') {
    h['X-Return-Format'] = cfg.respondWith;
  }
  if (cfg.engine && cfg.engine !== 'auto')
                         h['X-Engine']            = cfg.engine;
  if (cfg.retainImages && cfg.retainImages !== 'all')
                         h['X-Retain-Images']     = cfg.retainImages;
  if (cfg.retainLinks && cfg.retainLinks !== 'all')
                         h['X-Retain-Links']      = cfg.retainLinks;
  if (cfg.generatedAlt) h['X-With-Generated-Alt'] = 'true';
  if (cfg.withLinksSummaryAll)
                         h['X-With-Links-Summary']  = 'all';
  else if (cfg.withLinksSummary)
                         h['X-With-Links-Summary']  = 'true';
  if (cfg.withImagesSummary)
                         h['X-With-Images-Summary'] = 'true';
  if (cfg.respondTiming) h['X-Respond-Timing']   = cfg.respondTiming;
  if (cfg.chunking)      h['X-Markdown-Chunking'] = cfg.chunking;
  if (cfg.noCache)       h['X-No-Cache']          = 'true';
  if (cfg.maxTokens)     h['X-Max-Tokens']        = String(cfg.maxTokens);
  if (cfg.tokenBudget)   h['X-Token-Budget']      = String(cfg.tokenBudget);
  if (cfg.targetSelector)  h['X-Target-Selector']   = cfg.targetSelector;
  if (cfg.waitForSelector) h['X-Wait-For-Selector'] = cfg.waitForSelector;
  if (cfg.removeSelector)  h['X-Remove-Selector']   = cfg.removeSelector;
  if (cfg.withIframe)      h['X-With-Iframe']       = 'true';
  if (cfg.withShadowDom)   h['X-With-Shadow-Dom']   = 'true';
  if (cfg.chatSpaceId)     h['X-Chat-Space-Id']     = cfg.chatSpaceId;
  if (cfg.timeout)       h['X-Timeout']           = String(cfg.timeout);
  if (cfg.proxyUrl)      h['X-Proxy-Url']         = cfg.proxyUrl;
  if (cfg.acceptJson)    h['Accept']              = 'application/json';

  return h;
}

// Injected into tab to write clipboard
function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

// ─── Notify via badge + notification ─────────────────────────────────────────
function notify(tabId, state, detail = '') {
  const badge = { fetching: '…', done: '✓', error: '!' }[state] ?? '';
  const color = { fetching: '#6366f1', done: '#22c55e', error: '#ef4444' }[state] ?? '#6366f1';
  chrome.action.setBadgeText({ text: badge, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  if (state === 'done' || state === 'error') {
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), 3000);
  }
}

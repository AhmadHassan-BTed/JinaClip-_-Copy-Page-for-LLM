export const JINA_BASE_URL = 'https://r.jina.ai/';

export const CONTEXT_MENUS = [
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

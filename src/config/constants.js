export const DEFAULT_SHORTCUT = 'Alt+Shift+J';

export const STATUS_BADGE = {
  FETCHING: { text: '…', color: '#6366f1' },
  SUCCESS: { text: '✓', color: '#22c55e' },
  ERROR: { text: '!', color: '#ef4444' },
};

export const CONTEXT_MENUS = [
  // ── Quick actions ──
  { id: 'copy_default',       title: '⚡ Copy page (Local Engine)',    parentId: null },
  { id: 'sep1',               title: '-',                               parentId: null, type: 'separator' },

  // ── Response format ──
  { id: 'group_format',       title: '📄 Response Format',              parentId: null },
  { id: 'fmt_markdown',       title: 'Markdown (default)',              parentId: 'group_format' },
  { id: 'fmt_text',           title: 'Plain Text (innerText)',          parentId: 'group_format' },
  { id: 'fmt_screenshot',     title: 'Screenshot (Local)',              parentId: 'group_format' },
  { id: 'fmt_json',           title: 'JSON mode',                       parentId: 'group_format' },

  // ── Images ──
  { id: 'group_images',       title: '🖼️ Images',                     parentId: null },
  { id: 'img_all',            title: 'Keep images (default)',          parentId: 'group_images' },
  { id: 'img_none',           title: 'Drop all images',                 parentId: 'group_images' },
  { id: 'img_alt',            title: 'Keep alt text only',             parentId: 'group_images' },

  // ── Links ──
  { id: 'group_links',        title: '🔗 Links',                        parentId: null },
  { id: 'lnk_all',            title: 'Keep links (default)',           parentId: 'group_links' },
  { id: 'lnk_none',           title: 'Drop all links',                 parentId: 'group_links' },
  { id: 'lnk_text',           title: 'Keep anchor text only',          parentId: 'group_links' },

  // ── Summaries ──
  { id: 'group_summaries',    title: '📋 Summaries / Footers',          parentId: null },
  { id: 'sum_links',          title: 'Append links summary',           parentId: 'group_summaries' },
  { id: 'sum_links_all',      title: 'Append ALL links',               parentId: 'group_summaries' },
  { id: 'sum_images',         title: 'Append images summary',          parentId: 'group_summaries' },

  // ── Settings ──
  { id: 'sep2',               title: '-',                               parentId: null, type: 'separator' },
  { id: 'open_settings',      title: '⚙️ Settings…',                   parentId: null },
];

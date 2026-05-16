/**
 * Default configuration for the Local Jina Engine.
 * Replicates Jina Reader API parameters locally.
 */
export const defaultSettings = () => ({
  // Format
  respondWith: 'markdown', // 'markdown', 'html', 'text', 'screenshot', 'json'
  
  // Images & Links
  retainImages: 'all', // 'all', 'none', 'alt'
  retainLinks: 'all',  // 'all', 'none', 'text'
  withImagesSummary: false,
  withLinksSummary: false,
  withLinksSummaryAll: false,
  
  // Selectors (Native Implementation)
  targetSelector: '',
  removeSelector: '',
  waitForSelector: '',
  
  // Advanced DOM
  withIframe: false,
  withShadowDom: false,

  // Limits (Simulated)
  maxTokens: '',
  timeout: 30,
});

export const OPTION_FIELDS = Object.keys(defaultSettings());
export const OPTION_CHECKBOXES = new Set([
  'withImagesSummary', 'withLinksSummary', 'withLinksSummaryAll', 
  'withIframe', 'withShadowDom'
]);

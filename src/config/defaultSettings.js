/**
 * Default configuration for the extension.
 */
export const defaultSettings = () => ({
  // --- Processing ---
  preferredEngine: 'local', // 'local' or 'jina'
  
  // --- Jina Cloud Specific ---
  apiKey: '',
  respondWith: 'markdown',
  engine: 'auto',
  retainImages: 'all',
  retainLinks: 'all',
  generatedAlt: false,
  withImagesSummary: false,
  withLinksSummary: false,
  withLinksSummaryAll: false,
  respondTiming: '',
  chunking: '',
  noCache: false,
  
  // --- Scoping ---
  targetSelector: '',
  waitForSelector: '',
  removeSelector: '',
  withIframe: false,
  withShadowDom: false,
  chatSpaceId: '',

  // --- Limits ---
  maxTokens: '',
  tokenBudget: '',
  timeout: 30,
  proxyUrl: '',
  
  // --- Legacy mapping ---
  defaultJsonMode: false,
  acceptJson: false
});

export const OPTION_FIELDS = Object.keys(defaultSettings());
export const OPTION_CHECKBOXES = new Set([
  'generatedAlt', 'withImagesSummary', 'withLinksSummary', 
  'withLinksSummaryAll', 'noCache', 'withIframe', 
  'withShadowDom', 'defaultJsonMode', 'acceptJson'
]);

export const defaultSettings = () => ({
  apiKey: '',
  respondWith: 'markdown',
  engine: 'auto',
  retainImages: 'all',
  retainLinks: 'all',
  generatedAlt: false,
  withLinksSummary: false,
  withLinksSummaryAll: false,
  withImagesSummary: false,
  respondTiming: '',
  chunking: '',
  noCache: false,
  maxTokens: '',
  tokenBudget: '',
  targetSelector: '',
  waitForSelector: '',
  removeSelector: '',
  withIframe: false,
  withShadowDom: false,
  chatSpaceId: '',
  timeout: '',
  proxyUrl: '',
});

export const OPTION_FIELDS = [
  'apiKey', 'respondWith', 'defaultJsonMode', 'engine', 'proxyUrl',
  'retainImages', 'generatedAlt', 'withImagesSummary',
  'retainLinks', 'withLinksSummary', 'withLinksSummaryAll',
  'respondTiming', 'timeout',
  'targetSelector', 'waitForSelector', 'removeSelector',
  'withIframe', 'withShadowDom', 'chatSpaceId',
  'chunking',
  'maxTokens', 'tokenBudget',
  'noCache',
];

export const OPTION_CHECKBOXES = new Set([
  'defaultJsonMode', 'generatedAlt', 'withImagesSummary',
  'withLinksSummary', 'withLinksSummaryAll', 'noCache',
  'withIframe', 'withShadowDom',
]);

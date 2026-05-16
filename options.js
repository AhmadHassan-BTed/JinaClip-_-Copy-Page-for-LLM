// options.js

const FIELDS = [
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

const CHECKBOXES = new Set([
  'defaultJsonMode', 'generatedAlt', 'withImagesSummary',
  'withLinksSummary', 'withLinksSummaryAll', 'noCache',
  'withIframe', 'withShadowDom',
]);

function defaults() {
  return {
    apiKey: '', respondWith: 'markdown', defaultJsonMode: false,
    engine: 'auto', proxyUrl: '',
    retainImages: 'all', generatedAlt: false, withImagesSummary: false,
    retainLinks: 'all', withLinksSummary: false, withLinksSummaryAll: false,
    respondTiming: '', timeout: '',
    targetSelector: '', waitForSelector: '', removeSelector: '',
    withIframe: false, withShadowDom: false, chatSpaceId: '',
    chunking: '', maxTokens: '', tokenBudget: '',
    noCache: false,
  };
}

function loadIntoForm(settings) {
  for (const key of FIELDS) {
    const el = document.getElementById(key);
    if (!el) continue;
    if (CHECKBOXES.has(key)) {
      el.checked = !!settings[key];
    } else {
      el.value = settings[key] ?? '';
    }
  }
}

function readFromForm() {
  const out = {};
  for (const key of FIELDS) {
    const el = document.getElementById(key);
    if (!el) continue;
    out[key] = CHECKBOXES.has(key) ? el.checked : el.value;
  }
  // Persist under both key names for background.js compatibility
  out.acceptJson = out.defaultJsonMode;
  return out;
}

document.addEventListener('DOMContentLoaded', async () => {
  const { settings = defaults() } = await chrome.storage.sync.get('settings');
  loadIntoForm({ ...defaults(), ...settings });

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = readFromForm();
    await chrome.storage.sync.set({ settings });
    const banner = document.getElementById('savedBanner');
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 2500);
  });

  document.getElementById('resetBtn').addEventListener('click', async () => {
    const d = defaults();
    await chrome.storage.sync.set({ settings: d });
    loadIntoForm(d);
    const banner = document.getElementById('savedBanner');
    banner.textContent = '✓ Reset to defaults';
    banner.classList.remove('hidden');
    setTimeout(() => { banner.classList.add('hidden'); banner.textContent = '✓ Settings saved'; }, 2000);
  });
});

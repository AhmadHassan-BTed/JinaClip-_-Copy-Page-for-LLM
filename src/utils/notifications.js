/**
 * Sets the extension badge to indicate status.
 * @param {number} tabId
 * @param {'fetching'|'done'|'error'} state
 */
export function notify(tabId, state) {
  const badge = { fetching: '…', done: '✓', error: '!' }[state] ?? '';
  const color = { fetching: '#6366f1', done: '#22c55e', error: '#ef4444' }[state] ?? '#6366f1';
  chrome.action.setBadgeText({ text: badge, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  if (state === 'done' || state === 'error') {
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), 3000);
  }
}

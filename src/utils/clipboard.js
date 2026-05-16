/**
 * Injected into tab to write to clipboard
 * @param {string} text
 */
export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

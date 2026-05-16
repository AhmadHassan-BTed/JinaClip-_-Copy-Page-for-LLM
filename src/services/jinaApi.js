import { JINA_API_BASE } from '../config/constants.js';
import { Logger } from '../utils/logger.js';

/**
 * Service to interact with the Jina Reader API.
 */
export const JinaApiService = {
  /**
   * Fetches content from Jina Reader.
   * @param {string} url - The URL to read.
   * @param {Object} options - API headers and options.
   * @returns {Promise<string>} - The converted content.
   */
  async fetchContent(url, options = {}) {
    const jinaUrl = `${JINA_API_BASE}${url}`;
    const headers = this._buildHeaders(options);

    Logger.debug(`Executing fetch to: ${jinaUrl}`, { headers });

    const response = await fetch(jinaUrl, { headers });

    if (!response.ok) {
      Logger.error(`API response was not OK: ${response.status} ${response.statusText}`);
      throw new Error(`Jina Reader Error: ${response.status} ${response.statusText}`);
    }

    Logger.info(`API Request successful: ${response.status}`);

    if (options.acceptJson) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    }

    return response.text();
  },

  /**
   * Internal helper to construct Jina headers.
   * @private
   */
  _buildHeaders(cfg) {
    const headers = {};

    if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    
    // Format
    if (cfg.respondWith && cfg.respondWith !== 'markdown') {
      headers['X-Return-Format'] = cfg.respondWith;
    }

    // Advanced features
    if (cfg.engine && cfg.engine !== 'auto') headers['X-Engine'] = cfg.engine;
    if (cfg.retainImages && cfg.retainImages !== 'all') headers['X-Retain-Images'] = cfg.retainImages;
    if (cfg.retainLinks && cfg.retainLinks !== 'all') headers['X-Retain-Links'] = cfg.retainLinks;
    if (cfg.generatedAlt) headers['X-With-Generated-Alt'] = 'true';
    
    if (cfg.withLinksSummaryAll) headers['X-With-Links-Summary'] = 'all';
    else if (cfg.withLinksSummary) headers['X-With-Links-Summary'] = 'true';
    
    if (cfg.withImagesSummary) headers['X-With-Images-Summary'] = 'true';
    if (cfg.respondTiming) headers['X-Respond-Timing'] = cfg.respondTiming;
    if (cfg.chunking) headers['X-Markdown-Chunking'] = cfg.chunking;
    if (cfg.noCache) headers['X-No-Cache'] = 'true';
    
    // Selectors & Scoping
    if (cfg.targetSelector) headers['X-Target-Selector'] = cfg.targetSelector;
    if (cfg.waitForSelector) headers['X-Wait-For-Selector'] = cfg.waitForSelector;
    if (cfg.removeSelector) headers['X-Remove-Selector'] = cfg.removeSelector;
    if (cfg.withIframe) headers['X-With-Iframe'] = 'true';
    if (cfg.withShadowDom) headers['X-With-Shadow-Dom'] = 'true';
    if (cfg.chatSpaceId) headers['X-Chat-Space-Id'] = cfg.chatSpaceId;

    // Misc
    if (cfg.maxTokens) headers['X-Max-Tokens'] = String(cfg.maxTokens);
    if (cfg.tokenBudget) headers['X-Token-Budget'] = String(cfg.tokenBudget);
    if (cfg.timeout) headers['X-Timeout'] = String(cfg.timeout);
    if (cfg.proxyUrl) headers['X-Proxy-Url'] = cfg.proxyUrl;
    
    if (cfg.acceptJson) headers['Accept'] = 'application/json';

    return headers;
  }
};

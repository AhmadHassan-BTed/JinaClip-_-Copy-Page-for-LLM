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
    // 1. Validate URL
    if (!url.startsWith('http')) {
      throw new Error(`Invalid URL: Jina Reader can only fetch web pages (http/https). You are on: ${url}`);
    }

    const jinaUrl = `${JINA_API_BASE}${url}`;
    const headers = this._buildHeaders(options);

    Logger.info(`Fetching Jina content...`);
    Logger.debug(`Target Jina URL: ${jinaUrl}`);
    Logger.debug(`Outgoing Headers:`, JSON.stringify(headers, null, 2));

    const response = await fetch(jinaUrl, { headers });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      Logger.error(`API response was not OK: ${response.status} ${response.statusText}`);
      Logger.error(`API Error Body: ${errorText}`);
      throw new Error(`Jina Reader Error: ${response.status} ${response.statusText}`);
    }

    Logger.info(`API Request successful.`);

    if (options.acceptJson) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    }

    return response.text();
  },

  /**
   * Internal helper to construct Jina headers.
   * Filters out empty or default values to keep the request clean.
   * @private
   */
  _buildHeaders(cfg) {
    const headers = {};

    // Only add headers if they have a non-empty value
    const addIfValid = (headerName, value) => {
      if (value !== undefined && value !== null && value !== '') {
        headers[headerName] = String(value);
      }
    };

    if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    
    // Format
    if (cfg.respondWith && cfg.respondWith !== 'markdown') {
      headers['X-Return-Format'] = cfg.respondWith;
    }

    // Engine & Content
    addIfValid('X-Engine', cfg.engine !== 'auto' ? cfg.engine : null);
    addIfValid('X-Retain-Images', cfg.retainImages !== 'all' ? cfg.retainImages : null);
    addIfValid('X-Retain-Links', cfg.retainLinks !== 'all' ? cfg.retainLinks : null);
    
    if (cfg.generatedAlt) headers['X-With-Generated-Alt'] = 'true';
    if (cfg.withImagesSummary) headers['X-With-Images-Summary'] = 'true';

    if (cfg.withLinksSummaryAll) headers['X-With-Links-Summary'] = 'all';
    else if (cfg.withLinksSummary) headers['X-With-Links-Summary'] = 'true';
    
    addIfValid('X-Respond-Timing', cfg.respondTiming);
    addIfValid('X-Markdown-Chunking', cfg.chunking);
    if (cfg.noCache) headers['X-No-Cache'] = 'true';
    
    // Selectors
    addIfValid('X-Target-Selector', cfg.targetSelector);
    addIfValid('X-Wait-For-Selector', cfg.waitForSelector);
    addIfValid('X-Remove-Selector', cfg.removeSelector);
    
    if (cfg.withIframe) headers['X-With-Iframe'] = 'true';
    if (cfg.withShadowDom) headers['X-With-Shadow-Dom'] = 'true';
    addIfValid('X-Chat-Space-Id', cfg.chatSpaceId);

    // Limits
    addIfValid('X-Max-Tokens', cfg.maxTokens);
    addIfValid('X-Token-Budget', cfg.tokenBudget);
    addIfValid('X-Timeout', cfg.timeout);
    addIfValid('X-Proxy-Url', cfg.proxyUrl);
    
    if (cfg.acceptJson) headers['Accept'] = 'application/json';

    return headers;
  }
};

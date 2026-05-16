import { Logger } from '../utils/logger.js';

/**
 * Advanced Local Jina Engine (v6 - Pro Grade)
 * Implements Table support, Metadata headers, and Sequential Image labeling.
 */
export const LocalReaderService = {
  async parsePage(tabId, config) {
    Logger.info(`Local Engine (v6) Pro Grade starting...`);

    try {
      if (config.respondWith === 'screenshot' || config.respondWith === 'pageshot') {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        return `![Screenshot](${dataUrl})`;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: _engineCoreBody,
        args: [config]
      });

      if (!results || !results[0] || results[0].result === undefined) {
        throw new Error('Local engine failed to extract content.');
      }

      const output = results[0].result;
      if (output.error) throw new Error(output.error);

      if (config.respondWith === 'json') return JSON.stringify(output, null, 2);
      
      // Construct the Final Pro-Grade Output
      const meta = [
        `Title: ${output.title}`,
        `URL Source: ${output.url}`,
        output.publishedTime ? `Published Time: ${output.publishedTime}` : null
      ].filter(Boolean).join('\n');

      return `${meta}\n\nMarkdown Content:\n${output.content}`;
    } catch (err) {
      Logger.error('Local Engine v6 Error:', err);
      throw err;
    }
  }
};

/**
 * Injected Script: Pro Grade Engine
 */
function _engineCoreBody(cfg) {
  try {
    const title = document.title || 'Untitled Page';
    const url = window.location.href;
    const publishedTime = document.querySelector('meta[property="article:published_time"]')?.content || null;

    // 1. Scoring Engine (Improved for Dashboards)
    function getBestRoot() {
      const candidates = document.querySelectorAll('div, section, article, main, table');
      let best = document.body;
      let maxScore = 0;

      candidates.forEach(el => {
        const text = el.innerText || '';
        const links = el.querySelectorAll('a').length;
        if (text.length < 50) return;

        // Penalty for dashboard elements (buttons, inputs)
        const inputs = el.querySelectorAll('input, button, select').length;
        let score = (text.length / (links > 0 ? links * 0.4 : 1)) - (inputs * 20);
        
        if (['article', 'main'].includes(el.tagName.toLowerCase())) score *= 2;

        if (score > maxScore) {
          maxScore = score;
          best = el;
        }
      });
      return best;
    }

    const root = cfg.targetSelector ? (document.querySelector(cfg.targetSelector) || getBestRoot()) : getBestRoot();
    const clone = root.cloneNode(true);

    // 2. Pro Cleaning
    const junk = ['script', 'style', 'nav', 'footer', 'aside', '.ads', 'noscript', '.menu'];
    junk.forEach(s => clone.querySelectorAll(s).forEach(el => el.remove()));
    
    // Remove "Material Icon" text clutter
    clone.querySelectorAll('.material-icons, .material-symbols-outlined').forEach(el => el.remove());

    // 3. Advanced Markdown Converter (v6)
    let imageCount = 0;
    function nodeToMd(node) {
      let md = '';
      for (let child of node.childNodes) {
        if (child.nodeType === 3) {
          md += child.textContent.replace(/\s+/g, ' ');
        } else if (child.nodeType === 1) {
          const tag = child.tagName.toLowerCase();
          
          // --- Table Support ---
          if (tag === 'table') {
            md += `\n\n| ${Array.from(child.querySelectorAll('th, td')).map(cell => cell.innerText.trim()).join(' | ')} |\n| --- | --- |\n\n`;
            continue;
          }

          let inner = nodeToMd(child).trim();
          if (!inner && !['img', 'br', 'hr'].includes(tag)) continue;

          switch(tag) {
            case 'h1': md += `\n# ${inner}\n`; break;
            case 'h2': md += `\n## ${inner}\n`; break;
            case 'h3': md += `\n### ${inner}\n`; break;
            case 'p':  md += `\n\n${inner}\n\n`; break;
            case 'a':  md += `[${inner}](${child.href})`; break;
            case 'img': 
              imageCount++;
              md += `![Image ${imageCount}](${child.src})`; break;
            case 'li':  md += `\n* ${inner}`; break;
            case 'hr':  md += `\n* * *\n`; break;
            case 'strong': case 'b': md += `**${inner}**`; break;
            case 'code': md += ` \`${inner}\` `; break;
            case 'pre': md += `\n\`\`\`\n${inner}\n\`\`\`\n`; break;
            default: md += inner;
          }
        }
      }
      return md;
    }

    const rawMd = nodeToMd(clone);
    const cleanedMd = rawMd
      .replace(/\n{3,}/g, '\n\n') // Fix spacing
      .replace(/^[ \t]+|[ \t]+$/gm, '') // Trim lines
      .trim();

    return {
      title,
      url,
      publishedTime,
      content: cleanedMd
    };
  } catch (e) {
    return { error: `Pro Engine Error: ${e.message}` };
  }
}

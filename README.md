# Jina Reader — Chrome Extension

Convert any webpage to LLM-friendly text via [r.jina.ai](https://r.jina.ai) — directly from your browser toolbar.

## Features

- **One-click copy** — click the toolbar icon to instantly copy the current page as clean markdown. No popup required!
- **Keyboard shortcut** — `Alt+Shift+J` copies the page instantly.
- **Right-click context menu** — every Jina Reader option exposed as a submenu:
  - Response format (Markdown, HTML, Plain text, Screenshot, Pageshot, JSON)
  - Fetch engine (Auto / Browser / Curl)
  - Image handling (keep all / alt text only / drop / VLM-generate captions)
  - Link handling (keep all / text only / drop / GPT-OSS citation format)
  - Summary footers (links, all-links, images)
  - Response timing (html / visible-content / mutation-idle / resource-idle / media-idle / network-idle)
  - Markdown chunking (h1–h5, structured s1–s5)
  - Advanced DOM tracking (iframes, shadow dom)
  - Cache bypass
- **Settings page** — persistent defaults for every Jina header option
- **Badge feedback** — `…` while fetching, `✓` on success, `!` on error

## Installation (Developer Mode)

1. Clone / download this folder.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this folder.
5. Pin the extension from the puzzle-piece menu.

## Usage

| Action | Result |
|--------|--------|
| Click toolbar icon | Copies current page as LLM-friendly text immediately |
| `Alt+Shift+J` | Copies immediately |
| Right-click toolbar icon | Context menu with all Jina options |
| Right-click > Options | Opens Settings page for persistent defaults |

## Supported Jina Headers

| Header | Menu | Settings |
|--------|-------------|----------|
| `X-Return-Format` | ✓ | ✓ |
| `Accept: application/json` | ✓ | ✓ |
| `X-Engine` | ✓ | ✓ |
| `X-Retain-Images` | ✓ | ✓ |
| `X-With-Generated-Alt` | ✓ | ✓ |
| `X-With-Images-Summary` | ✓ | ✓ |
| `X-Retain-Links` | ✓ | ✓ |
| `X-With-Links-Summary` | ✓ | ✓ |
| `X-With-Links-Summary: all` | ✓ | ✓ |
| `X-Respond-Timing` | ✓ | ✓ |
| `X-Markdown-Chunking` | ✓ | ✓ |
| `X-No-Cache` | ✓ | ✓ |
| `X-With-Iframe` | ✓ | ✓ |
| `X-With-Shadow-Dom` | ✓ | ✓ |
| `X-Remove-Selector` | | ✓ |
| `X-Chat-Space-Id` | | ✓ |
| `X-Max-Tokens` | | ✓ |
| `X-Token-Budget` | | ✓ |
| `X-Target-Selector` | | ✓ |
| `X-Wait-For-Selector` | | ✓ |
| `X-Timeout` | | ✓ |
| `X-Proxy-Url` | | ✓ |
| `Authorization: Bearer` | | ✓ |

## File Structure

```
JinaClip - Copy Page for LLM/
├── manifest.json       # MV3 manifest
├── background.js       # Service worker — fetch, clipboard, context menus, shortcuts
├── options.html/css/js # Settings page
├── icons/              # 16/32/48/128 px icons
└── README.md
```

## License

MIT — feel free to fork and self-host.

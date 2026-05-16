# Jina Reader Browser Extension (Official)

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web_Store-green.svg)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Transform any webpage into LLM-friendly Markdown with a single click. **JinaClip** leverages the power of `r.jina.ai` to provide clean, structured content for your AI workflows.

## 🚀 Key Features

- **Instant Conversion:** One-click copy to clipboard using Jina Reader's optimized Markdown output.
- **Full API Coverage:** Access every Jina Reader header feature (VLM image captions, JSON responses, specific element targeting, etc.).
- **Smart Orchestration:** Automatically handles complex page structures, including iframes and shadow DOM.
- **Productivity First:** Custom keyboard shortcuts (`Alt+Shift+J`) and a deep context menu for power users.
- **Privacy Conscious:** Zero tracking. Your API keys are stored locally and securely in your browser's sync storage.

## 🛠 Architecture

The extension is built with a **Service-Oriented Architecture (SOA)** using native ES modules for maximum performance and zero-coupling.

- **Services:** Decoupled logic for API interaction (`JinaApiService`) and persistent storage (`StorageService`).
- **Utilities:** Modular helpers for notifications, clipboard interaction, and UI state.
- **Config-Driven:** Centralized configuration for easy maintenance and feature flagging.

## 📦 Installation (Development Mode)

1. Clone this repository.
2. Navigate to `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/` directory.

## 📖 Usage

| Action | Outcome |
|---|---|
| **Left-Click Icon** | Instantly copies current page to clipboard. |
| `Alt+Shift+J` | Instant copy (background). |
| **Right-Click Icon** | Advanced options (Format, Engine, Images, etc.). |
| **Options Page** | Configure default headers and API keys. |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for details on our modular architecture and coding standards.

---
Maintained by the Jina AI Community.

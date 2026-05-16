# 🚀 Jina Reader — Local Edition (v7)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Engine: Local-First](https://img.shields.io/badge/Engine-100%25_Local-orange.svg)](#-technical-excellence)
[![Privacy: Zero-Cloud](https://img.shields.io/badge/Privacy-Zero_Tracking-green.svg)](#-privacy--security)

**Jina Reader (Local)** is a high-performance, professional-grade browser extension that transforms any webpage into clean, LLM-friendly Markdown entirely within your browser. **No APIs, no rate limits, and zero costs.**

---

## 🌟 Why Local-First?

Unlike traditional "Reader" tools that send your data to the cloud, this extension uses a sophisticated **Local Extraction Engine (v7)**.
- **🚀 Absolute Speed:** Instant conversion without network latency.
- **🔒 Private by Design:** Your content never leaves your browser. Ideal for sensitive docs and internal dashboards.
- **♾️ Infinite Usage:** No Jina API keys, no monthly limits, and no "429 Too Many Requests" errors.

---

## ✨ Professional Features

### 🧠 Intelligence Mode (v7 Engine)
- **Heuristic Scoring:** Automatically identifies the "Main Content" of a page while ignoring navigation bars, ads, and login widgets.
- **Native Table Support:** Perfectly converts HTML tables into clean Markdown tables with pipes (`|`) and dividers.
- **Shadow DOM & Iframes:** Deep-traverses modern web components and embedded content that other scrapers miss.
- **Sequential Image Labeling:** Automatically labels images as `![Image 1]`, `![Image 2]` for better LLM grounding.

### 🛠 Power User Tools
- **Deep Context Menu:** Right-click the extension icon to access advanced modes:
  - **Copy with Links Summary:** Appends a structured link list at the end.
  - **Copy with Image Captions:** Uses heuristic metadata to "describe" images to your LLM.
  - **JSON Mode:** Returns a full structured payload (Title, URL, Content, Word Count).
- **Stitched Pageshots:** Captures full-page, high-resolution screenshots by scrolling and stitching the viewport automatically.
- **Keyboard Mastery:** Use `Alt+Shift+J` to instantly copy any page.

---

## 🛠 Installation

1. Clone or download this repository.
2. Navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dist/` folder.
5. Pin the **"J"** icon to your toolbar.

---

## 📖 Technical Architecture

The extension follows a modular, service-oriented architecture designed for maximum reliability:

- **`LocalReaderService` (The Brain):** A standalone engine that handles DOM scoring, cleaning, and conversion.
- **`Background Orchestrator`:** Manages the extension lifecycle, context menus, and global notifications.
- **`Offscreen Stitching`:** Uses `OffscreenCanvas` to handle high-memory image processing in a separate thread.

---

## 🤝 Open Source & Contributing

This project is open-source and owner-managed. We prioritize **Clean Code**, **Zero Coupling**, and **User Privacy**. Feel free to fork, modify, and build your own local-first AI pipelines!

---
*Maintained by the Community. Proudly powered by the Local-First movement.*

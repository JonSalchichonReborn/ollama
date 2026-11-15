# Ollama Chat

A clean, modern, responsive chat interface for a locally running [Ollama](https://ollama.com) instance.
No build step, no framework, no backend of its own — it talks straight to `http://localhost:11434`.

![stack](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Tailwind-15b79e)

---

## Features

| Area | What you get |
| --- | --- |
| **Ollama integration** | Model list from `GET /api/tags`, streaming chat via `POST /api/chat` with `stream: true` |
| **Live streaming** | Tokens render as they arrive, with a blinking caret and throttled markdown re-rendering |
| **Stop generating** | The send button turns into a red **Stop** button that aborts the request mid-response |
| **Markdown + code** | GFM rendering, syntax highlighting (highlight.js) and a **Copy** button on every code block |
| **Composer** | Auto-expanding textarea, `Enter` to send, `Shift + Enter` for a newline |
| **System prompt** | Editable from the settings dialog, sent as a `system` message on every request |
| **Chat history** | Conversations, titles and settings persist in `localStorage` across reloads |
| **Session control** | New chat, per-chat delete, and "Clear all chats" |
| **Connection status** | Live badge: *Checking…* / *Connected · n models* / *Ollama not detected*, plus a retry banner |
| **Theming** | Dark and light mode, remembered between sessions |

---

## Requirements

- **Ollama** installed and running locally.
- A **modern browser** (Chrome/Edge 111+, Firefox 113+, Safari 16.2+) — the UI uses `color-mix()` and `100dvh`.
- *(Optional)* **Node.js** or **Python 3** to serve the folder over HTTP instead of opening the file directly.

---

## Quick start

### 1. Start Ollama with CORS allowed

The page runs on a different origin than Ollama, so the server must accept cross-origin requests.
Set `OLLAMA_ORIGINS` **before** starting the server.

**Windows — PowerShell**

```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

**macOS / Linux**

```bash
OLLAMA_ORIGINS="*" ollama serve
```

To make it permanent on Windows:

```powershell
setx OLLAMA_ORIGINS "*"
```

> If Ollama is already running (for example from the Windows tray icon), quit it first — the environment
> variable is only read at startup.

Pull at least one model if you haven't already:

```bash
ollama pull llama3.2
```

### 2. Open the interface

**Option A — serve the folder (recommended)**

With Node.js:

```bash
cd OllamaChat
node serve.js
```

Or with Python:

```bash
cd OllamaChat
python -m http.server 5173
```

Then open <http://localhost:5173>.

On Windows you can just double-click `start.bat`, which picks Node.js if it is installed and falls
back to Python otherwise.

**Option B — open the file directly**

Double-click `index.html`. This works in most browsers, but `file://` pages send an `Origin: null`
header, so OLLAMA_ORIGINS must be `*` for the connection to be accepted.

### 3. Chat

Pick a model from the dropdown in the header, optionally set a system prompt via the gear icon,
and start typing.

---

## Project structure

```
OllamaChat/
├── index.html          # Markup: sidebar, topbar, message list, composer, modal
├── serve.js            # Zero-dependency static server (node serve.js)
├── start.bat           # Windows helper: serves the folder on http://localhost:5173
├── README.md
├── css/
│   └── styles.css      # Component styles + light/dark theme variables
└── js/
    ├── config.js       # Constants (Ollama base URL, storage keys, limits) + Utils
    ├── icons.js        # Inline SVG icon set (no icon library needed)
    ├── storage.js      # localStorage read/write for chats and settings
    ├── api.js          # GET /api/tags, POST /api/chat streaming reader
    ├── markdown.js     # marked + highlight.js, sanitising, code-block toolbar
    ├── ui.js           # All DOM rendering (stateless)
    └── app.js          # State, event wiring, streaming lifecycle
```

Scripts are plain classic scripts loaded in order and share a single `window.OllamaChat` namespace,
so the app also works when opened from `file://`.

---

## Configuration

All tunables live in [js/config.js](js/config.js):

```js
OLLAMA_BASE_URL: 'http://localhost:11434',  // point at a remote Ollama if you like
STREAM_RENDER_INTERVAL_MS: 80,              // markdown re-render throttle while streaming
MAX_TEXTAREA_HEIGHT: 200,                   // composer growth limit in px
```

The **system prompt** and the selected **model** are stored per browser in `localStorage`
under the keys `ollamachat.chats.v1`, `ollamachat.settings.v1` and `ollamachat.activeChat.v1`.

---

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Enter` | Send the message |
| `Shift + Enter` | Insert a newline |
| `Ctrl/Cmd + K` | Start a new chat |
| `Esc` | Close the dialog or the mobile sidebar |

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Badge shows **Ollama not detected** | Ollama isn't running. Start it with `ollama serve` and click the badge to retry. |
| Browser console shows a **CORS** error | Restart Ollama with `OLLAMA_ORIGINS="*"` (see step 1). Restarting is required — the variable is read at startup. |
| Dropdown says **No models found** | Pull a model: `ollama pull llama3.2`. |
| Everything is unstyled | The Tailwind CDN couldn't be reached. Check your internet connection — Tailwind, marked and highlight.js are loaded from CDNs. The app still functions without them. |
| `python -m http.server` fails on Windows | Python may be the Microsoft Store stub. Use `node serve.js` instead, or open `index.html` directly in the browser. |
| Response stops immediately with an error | The model may not be loaded yet. The first request can take a while — the stream begins once the model is in memory. |

---

## Privacy

Everything stays on your machine. Conversations are kept in your browser's `localStorage`
and prompts are sent only to your local Ollama instance — no telemetry, no external API calls
other than the CDN assets listed above.

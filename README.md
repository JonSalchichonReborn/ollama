# Ollama Chat

A clean, modern, responsive chat interface for a locally running [Ollama](https://ollama.com) instance.
No build step, no framework, no backend of its own — it talks straight to `http://localhost:11434`.

![stack](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Tailwind-15b79e)

---
Free Easy Installation in 4 simple steps using free tier of ai software https://trae.ai service no credit card required
1 Download or pull the files from this repo and place them in a new created file named local-ai-chat in your documents folder
2 Download the ai software at https://trae.ai and login into the free tier
3 Copy and execute the following promt down below in the trae chatbot
4 Open the file local-ai-chat and click on the start app, your if all good chatbot will appear and work locally from your browser.

Here is the installation promt for Trae

You are acting as a senior full-stack and local-AI deployment engineer.

GOAL
Create a fully working, local-only AI chat application on this Windows PC using:
- Node.js for the web server/backend
- Python for any required setup, testing, or utility scripts
- Ollama as the local model runtime
- Llama 3 and Qwen AI models
- The UI files I have provided

IMPORTANT: First, analyze every file I have provided before creating or changing anything.

PROJECT LOCATION
1. check the actual project files with the sample code for this project and the same folder where the project needs to be launched at the folder inside this PC’s Documents folder \local-ai-chat, located at:
   C:\Users\<my-username>\Documents\local-ai-chat



Do not place project files directly on the Desktop or in random folders.

STEP 1 — ANALYZE PROVIDED FILES
Before installation or coding:
1. List and inspect every provided file.
2. Identify the UI framework, entry point, assets, configuration files, package files, API endpoints, and expected backend behavior.
3. Detect whether the UI expects a specific server port, API route, model name, authentication method, streaming response format, or file structure.
4. Identify any missing dependencies, broken imports, environment variables, or incompatible code.
5. Summarize your findings in a short plan before making changes.
6. Preserve the provided UI design and functionality as much as possible. Only modify files when necessary to connect them to the local Ollama backend.

STEP 2 — CHECK SYSTEM ENVIRONMENT
1. Detect the operating system, CPU architecture, available RAM, GPU if present, and available disk space.
2. Check whether Node.js, npm, Python, pip, Git, and Ollama are already installed.
3. If Node.js or Python is missing, install stable LTS/current supported versions locally for this project where possible.
4. Prefer portable/local installations if they avoid requiring administrator privileges. If a system-wide install is required, explain exactly why and ask for confirmation before proceeding.
5. Record all installed versions in README.md.

STEP 3 — INSTALL RUNTIMES AND DEPENDENCIES
In the project folder:
1. Initialize a Node.js project.
2. Install only the Node.js dependencies required by the provided UI and backend, such as Express or Fastify if appropriate, CORS support, dotenv, and an Ollama client if needed.
3. Create a Python virtual environment inside the project, for example .venv.
4. Create requirements.txt and install only necessary Python packages.
5. Create package.json, requirements.txt, .env.example, and clear startup scripts.
6. Do not install unnecessary packages.

STEP 4 — INSTALL AND CONFIGURE OLLAMA
1. Check whether Ollama is installed.
2. If Ollama is not installed, install it using the official Windows installation method:
   irm https://ollama.com/install.ps1 | iex
3. Start or verify the Ollama service.
4. Verify that Ollama is reachable at:
   http://localhost:11434
5. Pull and test both models:
   ollama pull llama3
   ollama pull qwen3
6. Use model names that match the provided UI configuration. If the UI expects a different model identifier, create a clear configuration mapping instead of breaking the UI.
7. Choose a Qwen model size appropriate for this PC’s available RAM/VRAM. Start with a smaller model if hardware is limited, then document how to upgrade to a larger model.

Ollama serves its local API at http://localhost:11434, and Qwen3 can be run through Ollama with commands such as `ollama run qwen3`. [1][5][6]

STEP 5 — BUILD THE NODE.JS SERVER
Create a reliable local Node.js server that:
1. Serves the provided UI files.
2. Exposes a chat API endpoint, for example POST /api/chat.
3. Connects to Ollama at http://localhost:11434.
4. Supports both Llama 3 and Qwen model selection.
5. Supports streaming responses if the provided UI supports streaming.
6. Handles errors clearly, including “Ollama is not running,” “model not found,” and network/connection failures.
7. Uses environment variables for:
   OLLAMA_BASE_URL=http://localhost:11434
   DEFAULT_MODEL=llama3
   PORT=3000
8. Does not expose the server to the public internet. Bind locally only.

STEP 6 — CONNECT THE PROVIDED UI
1. Integrate the provided UI with the Node.js server.
2. Add a model selector for Llama 3 and Qwen if one does not already exist.
3. Ensure chat messages, model selection, loading states, errors, and streaming updates work smoothly.
4. Test every UI interaction that can be tested locally.
5. Fix frontend/backend mismatches without redesigning the UI unnecessarily.

STEP 7 — CREATE STARTUP AND VALIDATION TOOLS
Create:
1. start.bat — starts Ollama if needed, starts the Node.js server, and opens the local UI.
2. stop.bat — safely stops the local development server.
3. check-setup.py — validates Node.js, Python, Ollama, required models, server port, and UI files.
4. test-chat.py — sends a simple test prompt to both Llama 3 and Qwen through the local API.
5. README.md — includes:
   - Exact folder location
   - How to start the app
   - How to switch between Llama 3 and Qwen
   - How to change models
   - Troubleshooting steps
   - Hardware/RAM recommendations
   - How to update models safely

STEP 8 — TEST EVERYTHING
Before saying the project is complete:
1. Verify Node.js and Python run correctly.
2. Verify Ollama is running and reachable.
3. Verify both llama3 and qwen3 are installed and can respond.
4. Start the Node.js server.
5. Open the UI in the default browser.
6. Send a test prompt to Llama 3.
7. Send a test prompt to Qwen.
8. Test model switching.
9. Test streaming if supported.
10. Test error handling when Ollama is stopped.
11. Fix all errors found during testing.
12. Provide a final status report listing what works, what was installed, files created or modified, and any remaining limitations.

SAFETY AND QUALITY RULES
- Do not delete or overwrite my provided files without explaining why.
- Keep all processing and model inference local.
- Do not send my files, prompts, or chat content to external servers.
- Use clear, production-quality code with comments where needed.
- Ask for confirmation before installing large models, changing system-wide settings, or using administrator privileges.
- If a provided file is incomplete, corrupted, or unclear, ask me for clarification instead of guessing.

FINAL DELIVERABLE
When finished, give me:
1. The full project path.
2. A list of installed tools and versions.
3. The exact command or start.bat file to launch the app.
4. Confirmation that Llama 3 and Qwen both work through the provided UI.
5. Any known limitations based on my hardware.

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

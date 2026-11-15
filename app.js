/* ==========================================================================
   app.js — application state, event wiring and the streaming lifecycle
   ========================================================================== */

window.OllamaChat = window.OllamaChat || {};

(function (App) {
  'use strict';

  const CONFIG = App.CONFIG;
  const Utils = App.Utils;
  const Storage = App.Storage;
  const Api = App.Api;
  const UI = App.UI;

  const state = {
    chats: [],
    activeId: null,
    settings: Object.assign({}, CONFIG.DEFAULT_SETTINGS),
    models: [],
    connection: { state: 'checking', error: null },
    generating: false,
    controller: null
  };

  /** Auto-scroll only while the user is already parked near the bottom. */
  let stickToBottom = true;

  /* ------------------------------------------------------------ helpers */

  function activeChat() {
    for (let i = 0; i < state.chats.length; i += 1) {
      if (state.chats[i].id === state.activeId) return state.chats[i];
    }
    return null;
  }

  function createChat() {
    const now = Date.now();
    return { id: Utils.uid('chat'), title: 'New chat', createdAt: now, updatedAt: now, messages: [] };
  }

  function persist() {
    Storage.saveChats(state.chats);
    Storage.saveActiveId(state.activeId);
  }

  function currentModel() {
    const select = UI.els.modelSelect;
    const value = select ? select.value : '';
    return value || state.settings.model || '';
  }

  function emptyHint() {
    if (state.connection.state === 'offline') {
      return 'Ollama is not reachable. Start it with "ollama serve" and allow this page origin through OLLAMA_ORIGINS.';
    }
    if (!state.models.length) {
      return 'No models were found. Pull one first, for example: ollama pull llama3.2';
    }
    return 'Ask anything. Answers stream in token by token, and code blocks get a copy button.';
  }

  function refreshChatList() {
    UI.renderChatList(state.chats, state.activeId);
  }

  function refreshMessages() {
    UI.renderMessages(activeChat(), emptyHint());
  }

  function syncComposerMeta() {
    UI.setComposerMeta(currentModel(), state.settings.systemPrompt);
  }

  function scrollToBottom(force) {
    const box = UI.els.messages;
    if (!box) return;
    if (!force && !stickToBottom) return;
    box.scrollTop = box.scrollHeight;
  }

  /* ------------------------------------------------------------ connection */

  function checkConnection() {
    UI.setStatus('checking');
    UI.setBanner(null);

    return Api.checkConnection().then(function (result) {
      state.models = result.models;
      state.connection = result.ok
        ? { state: 'online', error: null }
        : { state: 'offline', error: result.error };

      UI.setStatus(result.ok ? 'online' : 'offline', { count: result.models.length });
      UI.setBanner(result.ok ? null : result.error);
      UI.renderModels(result.models, state.settings.model);

      state.settings.model = currentModel();
      Storage.saveSettings(state.settings);

      syncComposerMeta();
      if (activeChat()) refreshMessages();

      return result;
    });
  }

  /* ------------------------------------------------------------ chat actions */

  function selectChat(id) {
    if (state.generating) {
      UI.toast('Stop the current response before switching chats.');
      return;
    }
    state.activeId = id;
    Storage.saveActiveId(id);
    refreshChatList();
    refreshMessages();
    scrollToBottom(true);
    syncComposerMeta();
    UI.closeSidebar();
    focusPrompt();
  }

  function newChat() {
    if (state.generating) {
      UI.toast('Stop the current response before starting a new chat.');
      return;
    }
    const chat = createChat();
    state.chats.push(chat);
    state.activeId = chat.id;
    persist();
    refreshChatList();
    refreshMessages();
    syncComposerMeta();
    UI.closeSidebar();
    focusPrompt();
  }

  function deleteChat(id) {
    if (state.generating && id === state.activeId) {
      UI.toast('Stop the current response first.');
      return;
    }
    const index = state.chats.findIndex(function (chat) { return chat.id === id; });
    if (index < 0) return;

    state.chats.splice(index, 1);
    if (state.activeId === id) {
      state.activeId = state.chats.length ? state.chats[state.chats.length - 1].id : null;
    }
    persist();
    refreshChatList();
    refreshMessages();
  }

  function clearAllChats() {
    if (state.generating) {
      UI.toast('Stop the current response first.');
      return;
    }
    if (!state.chats.length) {
      UI.toast('There is nothing to clear.');
      return;
    }
    if (!window.confirm('Delete all saved conversations? This cannot be undone.')) return;

    state.chats = [];
    state.activeId = null;
    persist();
    refreshChatList();
    refreshMessages();
    UI.toast('Chat history cleared.');
  }

  function focusPrompt() {
    if (UI.els.prompt) UI.els.prompt.focus();
  }

  /* ------------------------------------------------------------ streaming */

  let streamTimer = null;
  let pendingText = '';

  function flushStream(row) {
    streamTimer = null;
    UI.setRowContent(row, pendingText, true);
    scrollToBottom();
  }

  function scheduleStreamRender(row, text) {
    pendingText = text;
    if (streamTimer) return;
    streamTimer = setTimeout(function () { flushStream(row); }, CONFIG.STREAM_RENDER_INTERVAL_MS);
  }

  function stopStreamRender() {
    if (streamTimer) {
      clearTimeout(streamTimer);
      streamTimer = null;
    }
  }

  function buildRequestMessages(chat) {
    const payload = [];
    const system = (state.settings.systemPrompt || '').trim();
    if (system) payload.push({ role: 'system', content: system });

    chat.messages.forEach(function (message) {
      if (!message.content) return;
      payload.push({ role: message.role, content: message.content });
    });
    return payload;
  }

  function finishGeneration(row, chat, assistantMessage, finalText) {
    stopStreamRender();
    assistantMessage.content = finalText;
    UI.setRowContent(row, finalText, false);
    UI.markStreaming(row, false);
    UI.setGenerating(false);
    state.generating = false;
    state.controller = null;

    chat.updatedAt = Date.now();
    persist();
    refreshChatList();
    scrollToBottom();
    focusPrompt();
  }

  function send() {
    if (state.generating) return;

    const input = UI.els.prompt;
    const text = input ? input.value.trim() : '';
    if (!text) return;

    if (state.connection.state === 'offline') {
      UI.toast('Ollama is not reachable — start it, then click the status badge to reconnect.');
      checkConnection();
      return;
    }

    const model = currentModel();
    if (!model) {
      UI.toast('No model available. Pull one first: ollama pull llama3.2');
      return;
    }

    if (!state.activeId) {
      const chat = createChat();
      state.chats.push(chat);
      state.activeId = chat.id;
    }
    const chat = activeChat();
    if (!chat) return;

    const userMessage = { id: Utils.uid('msg'), role: 'user', content: text, model: model, createdAt: Date.now() };
    chat.messages.push(userMessage);
    if (chat.title === 'New chat') chat.title = Utils.truncate(text, CONFIG.MAX_TITLE_LENGTH);
    chat.updatedAt = Date.now();

    const assistantMessage = { id: Utils.uid('msg'), role: 'assistant', content: '', model: model, createdAt: Date.now() };
    // Kept in the conversation immediately so the reply survives a reload.
    chat.messages.push(assistantMessage);

    UI.appendMessage(userMessage);
    const assistantRow = UI.appendMessage(assistantMessage);
    UI.markStreaming(assistantRow, true);

    UI.resetComposer();
    UI.autoGrow();
    UI.setGenerating(true);
    UI.setStatus('online', { count: state.models.length });
    UI.setBanner(null);
    scrollToBottom(true);
    refreshChatList();

    state.generating = true;
    state.controller = new AbortController();
    pendingText = '';

    // buildRequestMessages() already includes the user message we just pushed.
    const requestMessages = buildRequestMessages(chat);
    let accumulated = '';

    Api.streamChat({
      model: model,
      messages: requestMessages,
      signal: state.controller.signal,
      onToken: function (piece) {
        accumulated += piece;
        scheduleStreamRender(assistantRow, accumulated);
      }
    }).then(function () {
      finishGeneration(assistantRow, chat, assistantMessage, accumulated);
    }).catch(function (err) {
      stopStreamRender();

      if (err && err.name === 'AbortError') {
        const partial = accumulated || '*(Generation stopped before any output.)*';
        finishGeneration(assistantRow, chat, assistantMessage, partial);
        UI.toast('Generation stopped.');
        return;
      }

      const message = err && err.message ? err.message : 'The request failed.';
      state.generating = false;
      state.controller = null;
      UI.setGenerating(false);
      UI.markStreaming(assistantRow, false);

      const fallback = accumulated
        ? accumulated + '\n\n> ⚠️ ' + message
        : '> ⚠️ ' + message;
      assistantMessage.content = fallback;
      UI.setRowContent(assistantRow, fallback, false);
      chat.updatedAt = Date.now();
      persist();

      // Only a genuine network/CORS failure should mark Ollama as unreachable —
      // an HTTP error (unknown model, busy server, …) does not.
      if (err && err.isConnectionError) {
        state.connection = { state: 'offline', error: message };
        UI.setStatus('offline');
        UI.setBanner(message);
      }
      UI.toast(message);
    });
  }

  function stop() {
    if (state.controller) state.controller.abort();
  }

  /* ------------------------------------------------------------ events */

  function bindEvents() {
    const el = UI.els;

    /* --- sidebar --- */
    if (el.menuBtn) el.menuBtn.addEventListener('click', UI.openSidebar);
    if (el.sidebarClose) el.sidebarClose.addEventListener('click', UI.closeSidebar);
    if (el.sidebarBackdrop) el.sidebarBackdrop.addEventListener('click', UI.closeSidebar);
    if (el.newChatSide) el.newChatSide.addEventListener('click', newChat);
    if (el.clearAll) el.clearAll.addEventListener('click', clearAllChats);

    if (el.chatList) {
      el.chatList.addEventListener('click', function (event) {
        const del = event.target.closest('[data-delete-chat]');
        if (del) {
          deleteChat(del.getAttribute('data-delete-chat'));
          return;
        }
        const item = event.target.closest('[data-chat-id]');
        if (item) selectChat(item.getAttribute('data-chat-id'));
      });
    }

    /* --- topbar --- */
    if (el.statusBadge) {
      el.statusBadge.addEventListener('click', function () { checkConnection(); });
    }
    if (el.retryBtn) el.retryBtn.addEventListener('click', function () { checkConnection(); });

    if (el.modelSelect) {
      el.modelSelect.addEventListener('change', function () {
        state.settings.model = el.modelSelect.value;
        Storage.saveSettings(state.settings);
        syncComposerMeta();
        focusPrompt();
      });
    }

    if (el.themeBtn) {
      el.themeBtn.addEventListener('click', function () {
        state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
        Storage.saveSettings(state.settings);
        UI.setTheme(state.settings.theme);
      });
    }

    /* --- system prompt modal --- */
    if (el.settingsBtn) {
      el.settingsBtn.addEventListener('click', function () { UI.openSettings(state.settings.systemPrompt); });
    }
    if (el.savePrompt) {
      el.savePrompt.addEventListener('click', function () {
        state.settings.systemPrompt = el.systemPrompt ? el.systemPrompt.value : '';
        Storage.saveSettings(state.settings);
        UI.closeSettings();
        syncComposerMeta();
        UI.toast(state.settings.systemPrompt.trim() ? 'System prompt saved.' : 'System prompt cleared.');
        focusPrompt();
      });
    }
    if (el.resetPrompt) {
      el.resetPrompt.addEventListener('click', function () {
        if (el.systemPrompt) { el.systemPrompt.value = ''; el.systemPrompt.focus(); }
      });
    }

    const modal = el.settingsModal;
    if (modal) {
      modal.addEventListener('click', function (event) {
        if (event.target.closest('[data-close-modal]')) UI.closeSettings();
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (UI.settingsOpen()) UI.closeSettings();
        else UI.closeSidebar();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        newChat();
      }
    });

    /* --- composer --- */
    if (el.prompt) {
      el.prompt.addEventListener('input', function () {
        UI.autoGrow();
        UI.setSendEnabled(el.prompt.value.trim().length > 0);
      });

      el.prompt.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          if (el.prompt.value.trim()) send();
        }
      });
    }

    if (el.sendBtn) {
      el.sendBtn.addEventListener('click', function () {
        if (state.generating) stop();
        else send();
      });
    }

    /* --- auto-scroll tracking --- */
    if (el.messages) {
      el.messages.addEventListener('scroll', function () {
        const box = el.messages;
        stickToBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 80;
      });
    }

    /* --- copy buttons (delegated) --- */
    if (el.messages) {
      el.messages.addEventListener('click', function (event) {
        const codeBtn = event.target.closest('[data-copy-code]');
        if (codeBtn) {
          const shell = codeBtn.closest('.code-block');
          const code = shell && shell.querySelector('pre code');
          if (code) {
            Utils.copyText(code.textContent).then(
              function () { UI.flashCopied(codeBtn); },
              function () { UI.toast('Copying failed — select the code and copy manually.'); }
            );
          }
          return;
        }

        const msgBtn = event.target.closest('[data-copy-message]');
        if (msgBtn) {
          const row = msgBtn.closest('.msg-row');
          const message = row && findMessage(row.getAttribute('data-id'));
          if (message) {
            Utils.copyText(message.content).then(
              function () { UI.flashCopied(msgBtn); },
              function () { UI.toast('Copying failed — select the text and copy manually.'); }
            );
          }
        }
      });
    }
  }

  function findMessage(id) {
    const chat = activeChat();
    if (!chat || !id) return null;
    for (let i = 0; i < chat.messages.length; i += 1) {
      if (chat.messages[i].id === id) return chat.messages[i];
    }
    return null;
  }

  /* ------------------------------------------------------------ boot */

  function warnAboutMissingLibraries() {
    const missing = [];
    if (typeof window.tailwind === 'undefined') missing.push('Tailwind CSS');
    if (!App.Markdown.available) missing.push('marked (markdown)');
    if (!App.Markdown.highlighting) missing.push('highlight.js');
    if (missing.length) {
      UI.toast('Offline CDN: ' + missing.join(', ') + ' did not load. The app still works with reduced styling.', { duration: 7000 });
    }
  }

  function init() {
    UI.init();

    state.settings = Storage.loadSettings();
    state.chats = Storage.loadChats();

    UI.setTheme(state.settings.theme);

    const storedActive = Storage.loadActiveId();
    const hasStored = state.chats.some(function (chat) { return chat.id === storedActive; });
    state.activeId = hasStored ? storedActive : (state.chats.length ? state.chats[0].id : null);

    refreshChatList();
    refreshMessages();
    syncComposerMeta();
    UI.setSendEnabled(false);

    bindEvents();
    warnAboutMissingLibraries();
    checkConnection();
    focusPrompt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.OllamaChat);

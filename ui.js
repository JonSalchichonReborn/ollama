/* ==========================================================================
   ui.js — all DOM rendering. Stateless: it receives data and draws it.
   ========================================================================== */

window.OllamaChat = window.OllamaChat || {};

(function (App) {
  'use strict';

  const Utils = App.Utils;
  const Icons = App.Icons;
  const Markdown = App.Markdown;

  const els = {};
  let toastTimer = null;

  function init() {
    const ids = ['sidebar', 'sidebar-backdrop', 'chat-list', 'messages', 'model-select', 'status-badge',
      'conn-banner', 'conn-banner-text', 'retry-btn', 'prompt', 'send-btn', 'composer-model',
      'composer-system', 'settings-modal', 'system-prompt', 'reset-prompt', 'save-prompt', 'toast',
      'menu-btn', 'theme-btn', 'settings-btn', 'new-chat-side', 'clear-all', 'sidebar-close', 'storage-note'];

    ids.forEach(function (id) {
      els[id.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = document.getElementById(id);
    });

    Icons.hydrate(document);
  }

  /* ------------------------------------------------------------ chat list */

  function renderChatList(chats, activeId) {
    if (!els.chatList) return;
    els.chatList.innerHTML = '';

    if (!chats.length) {
      const empty = document.createElement('div');
      empty.className = 'chat-list-empty';
      empty.textContent = 'No conversations yet.';
      els.chatList.appendChild(empty);
      return;
    }

    const ordered = chats.slice().sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

    ordered.forEach(function (chat) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'chat-item' + (chat.id === activeId ? ' is-active' : '');
      item.setAttribute('data-chat-id', chat.id);
      item.title = chat.title || 'New chat';

      const title = document.createElement('span');
      title.className = 'chat-item-title';
      title.textContent = chat.title || 'New chat';

      const when = document.createElement('span');
      when.className = 'msg-model';
      when.textContent = Utils.relativeTime(chat.updatedAt);

      const del = document.createElement('span');
      del.className = 'chat-item-del';
      del.setAttribute('data-delete-chat', chat.id);
      del.setAttribute('role', 'button');
      del.setAttribute('aria-label', 'Delete chat');
      del.innerHTML = Icons.svg('trash-2', 14);

      item.appendChild(title);
      item.appendChild(when);
      item.appendChild(del);
      els.chatList.appendChild(item);
    });
  }

  /* ------------------------------------------------------------ messages */

  function emptyStateHtml(hint) {
    return '' +
      '<div class="empty-state">' +
        '<div class="empty-mark">' + Icons.svg('bot', 26) + '</div>' +
        '<h1>Chat with your local models</h1>' +
        '<p>' + Utils.escapeHtml(hint) + '</p>' +
      '</div>';
  }

  function createMessageRow(message) {
    const isUser = message.role === 'user';

    const row = document.createElement('div');
    row.className = 'msg-row';
    row.setAttribute('data-role', message.role);
    row.setAttribute('data-id', message.id);

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.innerHTML = Icons.svg(isUser ? 'user' : 'bot', 16);

    const body = document.createElement('div');
    body.className = 'msg-body';

    const meta = document.createElement('div');
    meta.className = 'msg-meta';

    const role = document.createElement('span');
    role.className = 'msg-role';
    role.textContent = isUser ? 'You' : 'Assistant';
    meta.appendChild(role);

    if (!isUser && message.model) {
      const model = document.createElement('span');
      model.className = 'msg-model';
      model.textContent = message.model;
      meta.appendChild(model);
    }

    const content = document.createElement('div');
    content.className = 'msg-content';

    const tools = document.createElement('div');
    tools.className = 'msg-tools';
    if (!isUser) {
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'tool-btn';
      copy.setAttribute('data-copy-message', '');
      copy.innerHTML = Icons.svg('copy', 13) + '<span>Copy</span>';
      tools.appendChild(copy);
    }

    body.appendChild(meta);
    body.appendChild(content);
    body.appendChild(tools);
    row.appendChild(avatar);
    row.appendChild(body);

    setRowContent(row, message.content, false);
    return row;
  }

  function setRowContent(row, text, streaming) {
    const content = row.querySelector('.msg-content');
    if (!content) return;

    if (row.getAttribute('data-role') === 'user') {
      content.innerHTML = Utils.escapeHtml(text).replace(/\n/g, '<br>');
    } else if (!text) {
      content.innerHTML = '<span class="typing-note">' + Utils.escapeHtml('Waiting for the first token…') + '</span>';
    } else {
      Markdown.renderInto(content, text, { streaming: streaming });
    }

    if (streaming) {
      const caret = document.createElement('span');
      caret.className = 'stream-caret';
      content.appendChild(caret);
    }
  }

  function renderMessages(chat, emptyHint) {
    if (!els.messages) return;
    els.messages.innerHTML = '';

    const messages = (chat && chat.messages) || [];
    if (!messages.length) {
      els.messages.innerHTML = emptyStateHtml(emptyHint || 'Send a message to get started.');
      return;
    }

    const fragment = document.createDocumentFragment();
    messages.forEach(function (message) {
      fragment.appendChild(createMessageRow(message));
    });
    els.messages.appendChild(fragment);
  }

  function appendMessage(message) {
    if (!els.messages) return null;
    const state = els.messages.querySelector('.empty-state');
    if (state) els.messages.innerHTML = '';

    const existing = els.messages.querySelector('.msg-row[data-id="' + message.id + '"]');
    if (existing) return existing;

    const row = createMessageRow(message);
    els.messages.appendChild(row);
    return row;
  }

  function findRow(messageId) {
    if (!els.messages) return null;
    return els.messages.querySelector('.msg-row[data-id="' + messageId + '"]');
  }

  function markStreaming(row, streaming) {
    if (!row) return;
    row.classList.toggle('is-streaming', Boolean(streaming));
  }

  /* ------------------------------------------------------------ status */

  function setStatus(state, info) {
    if (!els.statusBadge) return;
    els.statusBadge.setAttribute('data-state', state);

    const label = els.statusBadge.querySelector('.badge-label');
    if (!label) return;

    if (state === 'checking') {
      label.textContent = 'Checking…';
      els.statusBadge.title = 'Contacting ' + App.Api.baseUrl;
      return;
    }
    if (state === 'online') {
      const count = (info && info.count) || 0;
      label.textContent = 'Connected · ' + count + (count === 1 ? ' model' : ' models');
      els.statusBadge.title = 'Connected to ' + App.Api.baseUrl + ' — click to re-check';
      return;
    }
    label.textContent = 'Ollama not detected';
    els.statusBadge.title = 'Click to retry the connection';
  }

  function setBanner(message) {
    if (!els.connBanner) return;
    if (!message) {
      els.connBanner.hidden = true;
      return;
    }
    els.connBannerText.textContent = message;
    els.connBanner.hidden = false;
  }

  /* ------------------------------------------------------------ controls */

  function renderModels(models, selected) {
    if (!els.modelSelect) return;
    els.modelSelect.innerHTML = '';

    if (!models.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No models found';
      els.modelSelect.appendChild(option);
      els.modelSelect.disabled = true;
      return;
    }

    models.forEach(function (model) {
      const option = document.createElement('option');
      option.value = model.name;
      option.textContent = model.sizeLabel ? model.name + ' · ' + model.sizeLabel : model.name;
      option.title = [model.parameterSize, model.quantization].filter(Boolean).join(' · ');
      els.modelSelect.appendChild(option);
    });

    const names = models.map(function (m) { return m.name; });
    els.modelSelect.value = names.indexOf(selected) >= 0 ? selected : names[0];
    els.modelSelect.disabled = false;
  }

  function setComposerMeta(modelName, systemPrompt) {
    if (els.composerModel) els.composerModel.textContent = modelName || 'No model selected';
    if (els.composerSystem) {
      els.composerSystem.textContent = (systemPrompt && systemPrompt.trim())
        ? 'Custom system prompt'
        : 'No system prompt';
    }
  }

  function setGenerating(isGenerating) {
    if (!els.sendBtn) return;
    els.sendBtn.setAttribute('data-mode', isGenerating ? 'stop' : 'send');
    els.sendBtn.setAttribute('aria-label', isGenerating ? 'Stop generating' : 'Send message');
  }

  function setSendEnabled(enabled) {
    if (!els.sendBtn) return;
    if (els.sendBtn.getAttribute('data-mode') === 'stop') {
      els.sendBtn.disabled = false;
      return;
    }
    els.sendBtn.disabled = !enabled;
  }

  function autoGrow() {
    if (!els.prompt) return;
    els.prompt.style.height = 'auto';
    els.prompt.style.height = Math.min(els.prompt.scrollHeight, App.CONFIG.MAX_TEXTAREA_HEIGHT) + 'px';
  }

  function resetComposer() {
    if (!els.prompt) return;
    els.prompt.value = '';
    els.prompt.style.height = 'auto';
    setSendEnabled(false);
  }

  function setTheme(theme) {
    const isDark = theme !== 'light';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

    if (els.themeBtn) {
      els.themeBtn.innerHTML = Icons.svg(isDark ? 'sun' : 'moon', 18);
      els.themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    const darkSheet = document.getElementById('hljs-dark');
    const lightSheet = document.getElementById('hljs-light');
    if (darkSheet) darkSheet.disabled = !isDark;
    if (lightSheet) lightSheet.disabled = isDark;
  }

  function openSidebar() {
    if (!els.sidebar) return;
    els.sidebar.classList.add('is-open');
    if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = false;
  }

  function closeSidebar() {
    if (!els.sidebar) return;
    els.sidebar.classList.remove('is-open');
    if (els.sidebarBackdrop) els.sidebarBackdrop.hidden = true;
  }

  function openSettings(systemPrompt) {
    if (!els.settingsModal) return;
    if (els.systemPrompt) els.systemPrompt.value = systemPrompt || '';
    els.settingsModal.hidden = false;
    if (els.systemPrompt) els.systemPrompt.focus();
  }

  function closeSettings() {
    if (els.settingsModal) els.settingsModal.hidden = true;
  }

  function settingsOpen() {
    return Boolean(els.settingsModal && !els.settingsModal.hidden);
  }

  function toast(message, options) {
    if (!els.toast) return;
    const duration = (options && options.duration) || 2600;
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.hidden = true; }, duration);
  }

  /** Momentary success feedback on copy buttons. */
  function flashCopied(button) {
    if (!button || button.classList.contains('is-done')) return;
    const original = button.innerHTML;
    button.classList.add('is-done');
    button.innerHTML = Icons.svg('check', 13) + '<span>Copied</span>';
    setTimeout(function () {
      button.classList.remove('is-done');
      button.innerHTML = original;
    }, 1400);
  }

  App.UI = {
    els: els,
    init: init,
    renderChatList: renderChatList,
    renderMessages: renderMessages,
    appendMessage: appendMessage,
    findRow: findRow,
    setRowContent: setRowContent,
    markStreaming: markStreaming,
    setStatus: setStatus,
    setBanner: setBanner,
    renderModels: renderModels,
    setComposerMeta: setComposerMeta,
    setGenerating: setGenerating,
    setSendEnabled: setSendEnabled,
    autoGrow: autoGrow,
    resetComposer: resetComposer,
    setTheme: setTheme,
    openSidebar: openSidebar,
    closeSidebar: closeSidebar,
    openSettings: openSettings,
    closeSettings: closeSettings,
    settingsOpen: settingsOpen,
    toast: toast,
    flashCopied: flashCopied
  };
})(window.OllamaChat);

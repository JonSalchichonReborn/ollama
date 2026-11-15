/* ==========================================================================
   config.js — constants and small shared utilities
   ========================================================================== */

window.OllamaChat = window.OllamaChat || {};

(function (App) {
  'use strict';

  App.CONFIG = {
    /** Base URL of the local Ollama server (change if you expose it elsewhere). */
    OLLAMA_BASE_URL: 'http://localhost:11434',

    STORAGE_KEYS: {
      CHATS: 'ollamachat.chats.v1',
      SETTINGS: 'ollamachat.settings.v1',
      ACTIVE: 'ollamachat.activeChat.v1'
    },

    DEFAULT_SETTINGS: {
      systemPrompt: '',
      model: '',
      theme: 'dark'
    },

    /** How many characters of the first user message become the chat title. */
    MAX_TITLE_LENGTH: 48,

    /** Upper bound for the auto-growing textarea (matches styles.css max-height). */
    MAX_TEXTAREA_HEIGHT: 200,

    /** Throttle for re-rendering markdown while tokens stream in. */
    STREAM_RENDER_INTERVAL_MS: 80,

    /** Timeout for the connection probe. */
    CONNECTION_TIMEOUT_MS: 6000
  };

  const Utils = {
    uid: function (prefix) {
      return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    escapeHtml: function (value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    truncate: function (value, max) {
      const text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
      const limit = max || App.CONFIG.MAX_TITLE_LENGTH;
      return text.length > limit ? text.slice(0, limit - 1).trimEnd() + '…' : text;
    },

    /** "2m ago", "3h ago", "12 Oct" */
    relativeTime: function (timestamp) {
      if (!timestamp) return '';
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'just now';
      if (minutes < 60) return minutes + 'm ago';
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + 'h ago';
      const days = Math.floor(hours / 24);
      if (days < 7) return days + 'd ago';
      return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    },

    /** Human readable model size, e.g. "4.7 GB". */
    formatBytes: function (bytes) {
      if (!bytes || bytes < 0) return '';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let value = bytes;
      let unit = 0;
      while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
      }
      return value.toFixed(value >= 10 || unit === 0 ? 0 : 1) + ' ' + units[unit];
    },

    /** Clipboard write with a fallback for non-secure contexts. */
    copyText: function (text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        try {
          const area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.top = '-1000px';
          document.body.appendChild(area);
          area.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(area);
          ok ? resolve() : reject(new Error('Copy command was rejected'));
        } catch (err) {
          reject(err);
        }
      });
    },

    debounce: function (fn, wait) {
      let timer = null;
      return function () {
        const args = arguments;
        const self = this;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(self, args); }, wait);
      };
    }
  };

  App.Utils = Utils;
})(window.OllamaChat);

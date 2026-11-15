/* ==========================================================================
   storage.js — localStorage persistence for chats and settings
   ========================================================================== */

window.OllamaChat = window.OllamaChat || {};

(function (App) {
  'use strict';

  const KEYS = App.CONFIG.STORAGE_KEYS;

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (err) {
      console.warn('[storage] Could not read "' + key + '"', err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('[storage] Could not write "' + key + '"', err);
      return false;
    }
  }

  App.Storage = {
    loadChats: function () {
      const chats = read(KEYS.CHATS, []);
      return Array.isArray(chats) ? chats : [];
    },

    saveChats: function (chats) {
      return write(KEYS.CHATS, chats);
    },

    loadSettings: function () {
      const stored = read(KEYS.SETTINGS, {});
      return Object.assign({}, App.CONFIG.DEFAULT_SETTINGS, stored && typeof stored === 'object' ? stored : {});
    },

    saveSettings: function (settings) {
      return write(KEYS.SETTINGS, settings);
    },

    loadActiveId: function () {
      return read(KEYS.ACTIVE, null);
    },

    saveActiveId: function (id) {
      return write(KEYS.ACTIVE, id);
    }
  };
})(window.OllamaChat);

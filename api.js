/* ==========================================================================
   api.js — thin wrapper around the Ollama HTTP API
   Endpoints used:
     GET  /api/tags    -> installed models
     POST /api/chat    -> streaming chat completion (NDJSON)
   ========================================================================== */

window.OllamaChat = window.OllamaChat || {};

(function (App) {
  'use strict';

  const BASE_URL = App.CONFIG.OLLAMA_BASE_URL;

  function withTimeout(ms) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, ms);
    return { controller: controller, clear: function () { clearTimeout(timer); } };
  }

  function normalizeModel(raw) {
    const details = raw.details || {};
    return {
      name: raw.name || raw.model || '',
      size: raw.size || 0,
      sizeLabel: App.Utils.formatBytes(raw.size || 0),
      modifiedAt: raw.modified_at || '',
      family: details.family || '',
      parameterSize: details.parameter_size || '',
      quantization: details.quantization_level || ''
    };
  }

  function describeError(err) {
    if (err && err.name === 'AbortError') {
      return 'The request to Ollama timed out. Is "ollama serve" running?';
    }
    if (err instanceof TypeError) {
      return 'Cannot reach ' + BASE_URL + '. Make sure Ollama is running, then start it with CORS enabled: OLLAMA_ORIGINS="*" ollama serve';
    }
    return (err && err.message) ? err.message : 'Unknown error while contacting Ollama.';
  }

  const Api = {
    baseUrl: BASE_URL,

    describeError: describeError,

    /** Resolves to an array of installed models. Throws on failure. */
    listModels: function () {
      const guard = withTimeout(App.CONFIG.CONNECTION_TIMEOUT_MS);
      return fetch(BASE_URL + '/api/tags', { signal: guard.controller.signal })
        .then(function (res) {
          if (!res.ok) throw new Error('Ollama responded with HTTP ' + res.status + '.');
          return res.json();
        })
        .then(function (data) {
          const models = Array.isArray(data && data.models) ? data.models : [];
          return models.map(normalizeModel).sort(function (a, b) {
            return a.name.localeCompare(b.name);
          });
        })
        .catch(function (err) {
          if (err && err.name === 'AbortError') {
            throw new Error(describeError(err));
          }
          throw new Error(describeError(err));
        })
        .finally(function () {
          guard.clear();
        });
    },

    /** Never rejects: always resolves to { ok, models, error }. */
    checkConnection: function () {
      return this.listModels().then(
        function (models) { return { ok: true, models: models, error: null }; },
        function (err) { return { ok: false, models: [], error: err.message }; }
      );
    },

    /**
     * Streams a chat completion.
     * options: { model, messages, signal, onToken(text), onDone(stats) }
     * Rejects with an AbortError if the caller aborts.
     */
    streamChat: function (options) {
      const model = options.model;
      const messages = options.messages;
      const signal = options.signal;
      const onToken = options.onToken || function () {};
      const onDone = options.onDone || function () {};

      return fetch(BASE_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: messages, stream: true }),
        signal: signal
      }).then(function (res) {
        if (!res.ok) {
          return res.text().then(function (body) {
            let detail = '';
            try { detail = JSON.parse(body).error || ''; } catch (e) { detail = body; }
            throw new Error(detail || ('Ollama responded with HTTP ' + res.status + '.'));
          });
        }
        if (!res.body || typeof res.body.getReader !== 'function') {
          throw new Error('Streaming responses are not supported by this browser.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        function handleLine(line) {
          const trimmed = line.trim();
          if (!trimmed) return false;
          let payload;
          try { payload = JSON.parse(trimmed); } catch (e) { return false; }
          if (payload.error) throw new Error(payload.error);
          const piece = (payload.message && payload.message.content) || payload.response || '';
          if (piece) onToken(piece);
          if (payload.done) { onDone(payload); return true; }
          return false;
        }

        function pump() {
          return reader.read().then(function (result) {
            if (result.done) {
              if (buffer.trim()) handleLine(buffer);
              return;
            }
            buffer += decoder.decode(result.value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (let i = 0; i < lines.length; i += 1) {
              if (handleLine(lines[i])) return;
            }
            return pump();
          });
        }

        return pump();
      }).catch(function (err) {
        if (err && err.name === 'AbortError') throw err;
        if (err instanceof TypeError) {
          // fetch() only throws TypeError for network/CORS failures, never for
          // an HTTP error status — mark it so callers can flag the connection.
          const wrapped = new Error(describeError(err));
          wrapped.isConnectionError = true;
          throw wrapped;
        }
        throw err;
      });
    }
  };

  App.Api = Api;
})(window.OllamaChat);

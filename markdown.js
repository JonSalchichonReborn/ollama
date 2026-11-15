/* ==========================================================================
   markdown.js — markdown rendering, sanitising and code-block enhancement
   Depends on the optional CDN globals: window.marked, window.hljs
   ========================================================================== */

window.OllamaChat = window.OllamaChat || {};

(function (App) {
  'use strict';

  const Utils = App.Utils;
  const Icons = App.Icons;

  /** Elements that must never survive sanitising of model output. */
  const BLOCKED_TAGS = ['script', 'style', 'iframe', 'frame', 'object', 'embed', 'link', 'meta',
    'form', 'input', 'textarea', 'select', 'option', 'base'];

  function hasMarked() { return typeof window.marked !== 'undefined' && typeof window.marked.parse === 'function'; }
  function hasHighlighter() { return typeof window.hljs !== 'undefined' && typeof window.hljs.highlightElement === 'function'; }

  if (hasMarked()) {
    try {
      window.marked.setOptions({ gfm: true, breaks: true, pedantic: false });
    } catch (err) {
      console.warn('[markdown] Could not configure marked', err);
    }
  } else {
    console.warn('[markdown] marked.js was not loaded — falling back to plain text rendering.');
  }

  /**
   * Removes script-ish elements and inline event handlers from generated HTML.
   * The markup is built on a detached node, so nothing executes while cleaning.
   */
  function sanitize(html) {
    const holder = document.createElement('div');
    holder.innerHTML = html;

    const blocked = holder.querySelectorAll(BLOCKED_TAGS.join(','));
    for (let i = 0; i < blocked.length; i += 1) blocked[i].remove();

    const all = holder.querySelectorAll('*');
    for (let i = 0; i < all.length; i += 1) {
      const el = all[i];
      const attrs = Array.prototype.slice.call(el.attributes);
      for (let j = 0; j < attrs.length; j += 1) {
        const name = attrs[j].name.toLowerCase();
        const value = String(attrs[j].value || '');
        if (name.indexOf('on') === 0) {
          el.removeAttribute(attrs[j].name);
        } else if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^\s*(javascript|data):/i.test(value)) {
          el.removeAttribute(attrs[j].name);
        }
      }
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }
    return holder.innerHTML;
  }

  /** Converts markdown to sanitised HTML. */
  function toHtml(text) {
    const source = String(text == null ? '' : text);
    if (!source) return '';
    if (!hasMarked()) {
      return '<p>' + Utils.escapeHtml(source).replace(/\n/g, '<br>') + '</p>';
    }
    try {
      return sanitize(window.marked.parse(source));
    } catch (err) {
      console.warn('[markdown] Rendering failed, falling back to plain text', err);
      return '<p>' + Utils.escapeHtml(source).replace(/\n/g, '<br>') + '</p>';
    }
  }

  /**
   * Wraps every <pre><code> block with a toolbar holding the language label and
   * a "Copy" button. Highlighting is skipped while a response is still streaming
   * to avoid re-tokenising partially complete code on every tick.
   */
  function enhanceCodeBlocks(root, options) {
    if (!root) return;
    const highlight = !(options && options.streaming);
    const blocks = root.querySelectorAll('pre > code');

    for (let i = 0; i < blocks.length; i += 1) {
      const code = blocks[i];
      const pre = code.parentElement;
      if (!pre || pre.parentElement && pre.parentElement.classList.contains('code-block')) continue;

      const match = /language-([\w+#.-]+)/.exec(code.className || '');
      const language = match ? match[1] : (highlight ? 'auto' : 'code');

      if (highlight && hasHighlighter()) {
        try { window.hljs.highlightElement(code); } catch (err) { /* keep unstyled code */ }
      }

      const shell = document.createElement('div');
      shell.className = 'code-block';

      const bar = document.createElement('div');
      bar.className = 'code-bar';

      const label = document.createElement('span');
      label.className = 'code-lang';
      label.textContent = language;

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'code-copy';
      copy.setAttribute('data-copy-code', '');
      copy.setAttribute('aria-label', 'Copy code');
      copy.innerHTML = Icons.svg('copy', 13) + '<span>Copy</span>';

      bar.appendChild(label);
      bar.appendChild(copy);

      pre.parentNode.insertBefore(shell, pre);
      shell.appendChild(bar);
      shell.appendChild(pre);
    }
  }

  /** Full pipeline: HTML string -> DOM insertion -> code enhancement. */
  function renderInto(el, text, options) {
    if (!el) return;
    el.innerHTML = toHtml(text);
    enhanceCodeBlocks(el, options);
  }

  App.Markdown = {
    available: hasMarked,
    highlighting: hasHighlighter,
    toHtml: toHtml,
    renderInto: renderInto,
    enhanceCodeBlocks: enhanceCodeBlocks
  };
})(window.OllamaChat);

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Component functions
const { createBadge } = require('../src/components/badge.js');
const { createPanel } = require('../src/components/panel.js');
const { detectThemeMode } = require('../src/content.js');

// Simple DOM Mock helper for testing without heavy dependencies
function mockElement(tagName, ownerDocument) {
  const children = [];
  const attributes = {};
  const classList = new Set();
  const listeners = {};

  const el = {
    tagName: tagName.toUpperCase(),
    style: {},
    ownerDocument: ownerDocument || null,
    children,
    attributes,
    classList: {
      add: (cls) => classList.add(cls),
      remove: (cls) => classList.delete(cls),
      contains: (cls) => classList.has(cls),
      get value() { return Array.from(classList).join(' '); }
    },
    setAttribute: (k, v) => {
      attributes[k] = String(v);
      if (k === 'class') {
        classList.clear();
        v.split(' ').filter(Boolean).forEach(c => classList.add(c));
      }
    },
    getAttribute: (k) => attributes[k] || null,
    appendChild: (child) => { children.push(child); return child; },
    querySelector: (selector) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        const findIn = (node) => {
          if (node.classList && node.classList.contains(cls)) return node;
          for (const c of node.children || []) {
            const found = findIn(c);
            if (found) return found;
          }
          return null;
        };
        return findIn(el);
      }
      return null;
    },
    addEventListener: (evt, fn) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    dispatchEvent: (evt) => {
      const type = typeof evt === 'string' ? evt : evt.type;
      (listeners[type] || []).forEach(fn => fn(evt));
    },
    click: () => {
      el.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    },
    set className(val) {
      attributes['class'] = val;
      classList.clear();
      val.split(' ').filter(Boolean).forEach(c => classList.add(c));
    },
    get className() {
      return attributes['class'] || '';
    },
    set innerHTML(html) {
      el._innerHTML = html;
    },
    get innerHTML() {
      return el._innerHTML || '';
    },
    set textContent(txt) {
      el._textContent = txt;
    },
    get textContent() {
      return el._textContent || '';
    }
  };

  return el;
}

global.document = {
  createElement: (tag) => mockElement(tag, global.document),
  documentElement: mockElement('html'),
  body: mockElement('body'),
  querySelector: () => null
};

global.window = {
  matchMedia: () => ({ matches: false })
};

test('createBadge generates badge element with owner data', () => {
  const data = { owner: 'alice' };
  let clicked = false;
  const badge = createBadge(data, () => { clicked = true; });

  assert.strictEqual(badge.getAttribute('role'), 'button');
  assert.strictEqual(badge.getAttribute('title'), 'Code Owner: alice');
  assert.strictEqual(badge.classList.contains('ownership-radar-badge'), true);

  badge.click();
  assert.strictEqual(clicked, true);
});

test('createPanel generates panel element with owner explanation & stats', () => {
  const data = {
    owner: 'bob',
    avatarUrl: 'https://example.com/bob.png',
    explanation: 'Most active contributor recently',
    commits30d: 25,
    linesChanged: 1200,
    score: '95%'
  };

  const panel = createPanel(data);

  assert.strictEqual(panel.classList.contains('ownership-radar-panel'), true);
  const closeBtn = panel.querySelector('.ownership-radar-panel-close');
  assert.ok(closeBtn);

  panel.classList.add('is-visible');
  assert.strictEqual(panel.classList.contains('is-visible'), true);

  closeBtn.click();
  assert.strictEqual(panel.classList.contains('is-visible'), false);
});

test('detectThemeMode correctly identifies light and dark mode contexts', () => {
  global.document.documentElement.setAttribute('data-color-mode', 'light');
  assert.strictEqual(detectThemeMode(), 'light');

  global.document.documentElement.setAttribute('data-color-mode', 'dark');
  assert.strictEqual(detectThemeMode(), 'dark');

  global.document.documentElement.setAttribute('data-color-mode', 'auto');
  global.document.documentElement.setAttribute('data-dark-theme', 'dark');
  assert.strictEqual(detectThemeMode(), 'dark');
});

test('CSS file contains GitHub dark mode variables and badge/panel dark selectors', () => {
  const cssContent = fs.readFileSync(path.join(__dirname, '../src/styles/ownership-radar.css'), 'utf8');

  assert.ok(cssContent.includes('--color-canvas-default'));
  assert.ok(cssContent.includes('[data-color-mode="dark"]'));
  assert.ok(cssContent.includes('[data-dark-theme]'));
  assert.ok(cssContent.includes('@media (prefers-color-scheme: dark)'));
  assert.ok(cssContent.includes('.ownership-radar-badge'));
  assert.ok(cssContent.includes('.ownership-radar-panel'));
});

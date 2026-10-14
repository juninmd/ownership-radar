/**
 * Ownership Radar - Content Script
 * Detects GitHub repository page contexts and inserts badge and explanation panel into the UI.
 */

(function () {
  'use strict';

  function detectThemeMode() {
    if (typeof document === 'undefined') return 'light';
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    const colorMode = htmlEl?.getAttribute('data-color-mode') || bodyEl?.getAttribute('data-color-mode');
    const darkTheme = htmlEl?.getAttribute('data-dark-theme') || bodyEl?.getAttribute('data-dark-theme');

    if (colorMode === 'dark' || darkTheme || (colorMode === 'auto' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  }

  function injectOwnershipRadar() {
    if (typeof document === 'undefined') return;
    // Find injection container (e.g. file header, repo header, or file path header)
    const targetHeader = document.querySelector('.Box-header, .file-navigation, .f4.mb-3, [data-testid="breadcrumbs-filename-container"]');

    if (!targetHeader || targetHeader.querySelector('.ownership-radar-container')) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'ownership-radar-container';
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.marginLeft = '8px';

    const sampleOwnerData = {
      owner: 'octocat',
      avatarUrl: 'https://github.com/octocat.png',
      explanation: 'Primary author with 78% of commit changes in the last 30 days.',
      commits30d: 14,
      linesChanged: 342,
      score: '92%'
    };

    const badge = typeof createBadge === 'function' ? createBadge(sampleOwnerData, togglePanel) : null;
    const panel = typeof createPanel === 'function' ? createPanel(sampleOwnerData) : null;

    if (!badge || !panel) return;

    function togglePanel(e) {
      if (panel.classList.contains('is-visible')) {
        panel.classList.remove('is-visible');
      } else {
        panel.classList.add('is-visible');
      }
    }

    container.appendChild(badge);
    container.appendChild(panel);
    targetHeader.appendChild(container);
  }

  function initObserver() {
    if (typeof document === 'undefined') return;
    const themeObserver = new MutationObserver(() => {
      const currentTheme = detectThemeMode();
      document.body.setAttribute('data-ownership-radar-theme', currentTheme);
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode', 'data-dark-theme', 'class']
    });

    injectOwnershipRadar();

    const domObserver = new MutationObserver(() => {
      injectOwnershipRadar();
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObserver);
    } else {
      initObserver();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detectThemeMode, injectOwnershipRadar };
  }
})();

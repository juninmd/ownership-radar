/**
 * Creates and manages the Code Owner Badge UI component.
 */

function createBadge(ownerData, onClickHandler) {
  const badge = document.createElement('div');
  badge.className = 'ownership-radar-badge';
  badge.setAttribute('role', 'button');
  badge.setAttribute('tabindex', '0');
  badge.setAttribute('title', `Code Owner: ${ownerData.owner || 'Unknown'}`);

  const iconSvg = `
    <svg class="ownership-radar-badge-icon" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0ZM8 3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm.75 4v4.5a.75.75 0 0 1-1.5 0V7.5a.75.75 0 0 1 .75-.75Z"></path>
    </svg>
  `;

  const label = document.createElement('span');
  label.className = 'ownership-radar-badge-label';
  label.textContent = ownerData.owner ? `Owner: ${ownerData.owner}` : 'Code Owner';

  badge.innerHTML = iconSvg;
  badge.appendChild(label);

  if (onClickHandler) {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      onClickHandler(e);
    });
  }

  return badge;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createBadge };
}

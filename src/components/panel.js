/**
 * Creates and manages the Explanation Panel UI component.
 */

function createPanel(ownerData) {
  const panel = document.createElement('div');
  panel.className = 'ownership-radar-panel';

  const header = document.createElement('div');
  header.className = 'ownership-radar-panel-header';

  const title = document.createElement('span');
  title.textContent = 'Ownership Explanation';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ownership-radar-panel-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';

  header.appendChild(title);
  header.appendChild(closeBtn);

  const content = document.createElement('div');
  content.className = 'ownership-radar-panel-body';

  const ownerInfo = document.createElement('div');
  ownerInfo.className = 'ownership-radar-owner-info';

  const avatar = document.createElement('img');
  avatar.className = 'ownership-radar-avatar';
  avatar.src = ownerData.avatarUrl || 'https://github.com/ghost.png';
  avatar.alt = ownerData.owner || 'Code Owner';

  const ownerName = document.createElement('span');
  ownerName.className = 'ownership-radar-owner-name';
  ownerName.textContent = ownerData.owner || 'Unknown Owner';

  ownerInfo.appendChild(avatar);
  ownerInfo.appendChild(ownerName);

  const explanation = document.createElement('p');
  explanation.className = 'ownership-radar-explanation';
  explanation.textContent = ownerData.explanation || 'Suggested based on recent commit frequency and recency.';

  const stats = document.createElement('div');
  stats.className = 'ownership-radar-stats';

  const createStatItem = (label, val) => {
    const item = document.createElement('div');
    item.className = 'ownership-radar-stat-item';
    const lSpan = document.createElement('span');
    lSpan.textContent = label;
    const vSpan = document.createElement('span');
    vSpan.className = 'ownership-radar-stat-value';
    vSpan.textContent = val;
    item.appendChild(lSpan);
    item.appendChild(vSpan);
    return item;
  };

  stats.appendChild(createStatItem('Commits (30d)', ownerData.commits30d || 0));
  stats.appendChild(createStatItem('Lines Changed', ownerData.linesChanged || 0));
  stats.appendChild(createStatItem('Score', ownerData.score || 'N/A'));

  content.appendChild(ownerInfo);
  content.appendChild(explanation);
  content.appendChild(stats);

  panel.appendChild(header);
  panel.appendChild(content);

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.remove('is-visible');
  });

  return panel;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createPanel };
}

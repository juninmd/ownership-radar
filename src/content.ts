import { OwnershipSuggestion } from './types.js';

export function renderOwnershipWidget(suggestions: OwnershipSuggestion[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ownership-radar-widget';
  container.style.cssText = `
    border: 1px solid #d0d7de;
    border-radius: 6px;
    padding: 12px;
    background-color: #ffffff;
    font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    margin-bottom: 16px;
  `;

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
  header.innerHTML = `
    <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2328;">
      🎯 Ownership Suggestions
    </h3>
    <span style="font-size: 11px; color: #636c76; background-color: #f6f8fa; padding: 2px 6px; border-radius: 12px; border: 1px solid #d0d7de;">
      Dynamic Score Breakdown
    </span>
  `;
  container.appendChild(header);

  if (!suggestions || suggestions.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'font-size: 12px; color: #636c76; margin: 0;';
    empty.textContent = 'No ownership data available for this path.';
    container.appendChild(empty);
    return container;
  }

  const list = document.createElement('ul');
  list.style.cssText = 'list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;';

  suggestions.forEach((item) => {
    const li = document.createElement('li');
    li.style.cssText = 'padding: 8px; border: 1px solid #f0f2f5; border-radius: 4px; background-color: #fdfdfd;';

    const roleBadge = item.role ? `<span style="font-size: 10px; padding: 1px 4px; background-color: #ddf4ff; color: #0969da; border-radius: 4px; margin-left: 4px; text-transform: uppercase;">${item.role}</span>` : '';
    const topBadge = item.isTopOwner ? `<span style="font-size: 10px; padding: 1px 4px; background-color: #dafbe1; color: #1a7f37; border-radius: 4px; margin-left: 4px; font-weight: bold;">Top Owner</span>` : '';

    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
        <div>
          <strong style="color: #1f2328;">@${item.username}</strong>
          ${roleBadge}
          ${topBadge}
        </div>
        <div style="font-weight: 600; color: #0969da;">
          ${item.finalScore}%
        </div>
      </div>
      <div style="font-size: 11px; color: #636c76; margin-top: 4px; line-height: 1.4; word-break: break-word;">
        💡 <em>Why:</em> ${item.breakdown.explanation}
      </div>
    `;

    list.appendChild(li);
  });

  container.appendChild(list);
  return container;
}

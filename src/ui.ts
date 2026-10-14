import { FileOwnershipResult } from './types';

/**
 * Renders an ownership badge element to display in GitHub UI header / sidebar.
 */
export function createOwnershipBadge(result: FileOwnershipResult): HTMLElement {
  const badge = document.createElement('div');
  badge.className = 'ownership-radar-badge';
  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  badge.style.gap = '6px';
  badge.style.padding = '4px 8px';
  badge.style.borderRadius = '6px';
  badge.style.border = '1px solid #d0d7de';
  badge.style.backgroundColor = '#f6f8fa';
  badge.style.fontSize = '12px';
  badge.style.color = '#24292f';
  badge.style.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';

  const icon = document.createElement('span');
  icon.textContent = '🎯';

  const text = document.createElement('span');
  if (result.topOwner) {
    const scopeInfo = result.packageName ? ` (${result.packageName})` : '';
    text.textContent = `Owner: @${result.topOwner.author}${scopeInfo}`;
  } else {
    text.textContent = 'Owner: Unassigned';
  }

  badge.appendChild(icon);
  badge.appendChild(text);

  if (result.topOwner) {
    const popup = createOwnershipPopup(result);
    badge.style.cursor = 'pointer';
    badge.title = result.topOwner.whyExplanation;

    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const existing = document.getElementById('ownership-radar-popup');
      if (existing) {
        existing.remove();
      } else {
        document.body.appendChild(popup);
      }
    });
  }

  return badge;
}

/**
 * Renders explanation modal/popup explaining ownership and monorepo package scoping reasoning.
 */
export function createOwnershipPopup(result: FileOwnershipResult): HTMLElement {
  const popup = document.createElement('div');
  popup.id = 'ownership-radar-popup';
  popup.style.position = 'fixed';
  popup.style.top = '100px';
  popup.style.right = '20px';
  popup.style.zIndex = '9999';
  popup.style.width = '320px';
  popup.style.padding = '16px';
  popup.style.backgroundColor = '#ffffff';
  popup.style.border = '1px solid #d0d7de';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 8px 24px rgba(140,149,159,0.2)';
  popup.style.color = '#24292f';
  popup.style.fontSize = '13px';

  const title = document.createElement('h4');
  title.style.margin = '0 0 8px 0';
  title.style.fontSize = '14px';
  title.textContent = 'Ownership Insights';

  const scopeBadge = document.createElement('div');
  scopeBadge.style.fontSize = '11px';
  scopeBadge.style.color = '#57606a';
  scopeBadge.style.marginBottom = '12px';
  scopeBadge.textContent = result.packageName
    ? `Package Scope: ${result.packageName} (${result.packageRoot})`
    : `File Scope: ${result.filePath}`;

  popup.appendChild(title);
  popup.appendChild(scopeBadge);

  result.owners.forEach((owner) => {
    const item = document.createElement('div');
    item.style.marginBottom = '8px';
    item.style.paddingBottom = '8px';
    item.style.borderBottom = '1px solid #hsla(210,18%,87%,1)';

    const name = document.createElement('strong');
    name.textContent = `@${owner.author} (${owner.score}%)`;

    const desc = document.createElement('p');
    desc.style.margin = '4px 0 0 0';
    desc.style.color = '#57606a';
    desc.style.fontSize = '12px';
    desc.textContent = owner.whyExplanation;

    item.appendChild(name);
    item.appendChild(desc);
    popup.appendChild(item);
  });

  return popup;
}

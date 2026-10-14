import { parseGitHubPRUrl, fetchPRFiles, fetchFileCommits } from './github.js';
import { recommendReviewers } from './ownership.js';
import { ReviewerSuggestion, Commit } from './types.js';

export function renderReviewerRadarWidget(suggestions: ReviewerSuggestion[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'discussion-sidebar-item ownership-radar-widget';
  container.style.borderTop = '1px solid var(--color-border-muted, #d0d7de)';
  container.style.paddingTop = '16px';
  container.style.marginTop = '16px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '8px';

  const title = document.createElement('span');
  title.style.fontWeight = '600';
  title.style.fontSize = '12px';
  title.style.color = 'var(--color-fg-muted, #636c76)';
  title.style.textTransform = 'uppercase';
  title.innerText = 'Suggested Reviewers (Radar)';

  header.appendChild(title);
  container.appendChild(header);

  if (suggestions.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.fontSize = '12px';
    emptyMsg.style.color = 'var(--color-fg-muted, #656d76)';
    emptyMsg.innerText = 'No reviewer recommendations found based on commit history.';
    container.appendChild(emptyMsg);
    return container;
  }

  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = '0';
  list.style.margin = '0';

  for (const suggestion of suggestions) {
    const item = document.createElement('li');
    item.style.marginBottom = '12px';
    item.style.fontSize = '12px';

    const userRow = document.createElement('div');
    userRow.style.display = 'flex';
    userRow.style.alignItems = 'center';
    userRow.style.justifyContent = 'space-between';

    const userLink = document.createElement('a');
    userLink.href = `/${suggestion.username}`;
    userLink.style.fontWeight = '600';
    userLink.style.color = 'var(--color-accent-fg, #0969da)';
    userLink.style.textDecoration = 'none';
    userLink.innerText = `@${suggestion.username}`;

    const scoreBadge = document.createElement('span');
    scoreBadge.style.backgroundColor = 'var(--color-neutral-subtle, #f6f8fa)';
    scoreBadge.style.border = '1px solid var(--color-border-default, #d0d7de)';
    scoreBadge.style.borderRadius = '10px';
    scoreBadge.style.padding = '2px 8px';
    scoreBadge.style.fontSize = '11px';
    scoreBadge.style.fontWeight = '500';
    scoreBadge.innerText = `${suggestion.ownershipPercentage}% ownership`;

    userRow.appendChild(userLink);
    userRow.appendChild(scoreBadge);
    item.appendChild(userRow);

    const explanationList = document.createElement('div');
    explanationList.style.marginTop = '4px';
    explanationList.style.paddingLeft = '8px';
    explanationList.style.borderLeft = '2px solid var(--color-accent-muted, #54a3ff)';

    for (const exp of suggestion.explanations) {
      const expItem = document.createElement('div');
      expItem.style.color = 'var(--color-fg-muted, #656d76)';
      expItem.style.fontSize = '11px';
      expItem.style.lineHeight = '1.4';
      expItem.innerText = `• ${exp}`;
      explanationList.appendChild(expItem);
    }

    item.appendChild(explanationList);
    list.appendChild(item);
  }

  container.appendChild(list);
  return container;
}

export async function initOwnershipRadar() {
  const prDetails = parseGitHubPRUrl();
  if (!prDetails) return;

  // Try extracting PR author from DOM if available
  const authorMeta = document.querySelector('.author, meta[name="author"], .pull-header-username');
  if (authorMeta) {
    prDetails.author = authorMeta.textContent?.trim() || '';
  }

  const sidebar = document.querySelector('#partial-discussion-sidebar') || document.querySelector('.discussion-sidebar');
  if (!sidebar) return;

  // Avoid duplication
  if (document.querySelector('.ownership-radar-widget')) return;

  const changedFiles = await fetchPRFiles(prDetails.owner, prDetails.repo, prDetails.pullNumber);
  if (changedFiles.length === 0) return;

  // Fetch commit history for each file concurrently
  const commitPromises = changedFiles.slice(0, 10).map((file) => fetchFileCommits(prDetails.owner, prDetails.repo, file));
  const commitResults = await Promise.all(commitPromises);
  const allCommits: Commit[] = commitResults.flat();

  const suggestions = recommendReviewers(changedFiles, allCommits, { prAuthor: prDetails.author });
  const widget = renderReviewerRadarWidget(suggestions);

  sidebar.appendChild(widget);
}

// Auto-run if script is loaded in browser content context
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initOwnershipRadar());
  } else {
    initOwnershipRadar();
  }
}

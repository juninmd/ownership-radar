import { TrendSummary } from '../types.js';

export function getTrendIcon(direction: 'increased' | 'decreased' | 'unchanged'): string {
  switch (direction) {
    case 'increased':
      return '📈';
    case 'decreased':
      return '📉';
    case 'unchanged':
    default:
      return '➖';
  }
}

export function getTrendCssClass(direction: 'increased' | 'decreased' | 'unchanged'): string {
  switch (direction) {
    case 'increased':
      return 'ownership-trend-increased';
    case 'decreased':
      return 'ownership-trend-decreased';
    case 'unchanged':
    default:
      return 'ownership-trend-unchanged';
  }
}

export function createOwnershipTrendBadge(summary: TrendSummary): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `ownership-radar-badge ${getTrendCssClass(summary.trend.trendDirection)}`;

  badge.setAttribute('data-author', summary.author);
  badge.setAttribute('data-module', summary.module);
  badge.setAttribute('data-direction', summary.trend.trendDirection);
  badge.setAttribute('data-change-percent', summary.trend.percentagePointsChange.toString());

  const prevShare = Math.round(summary.trend.previousOwnershipShare * 100);
  const currShare = Math.round(summary.trend.currentOwnershipShare * 100);
  badge.setAttribute('title', `Previous ${summary.timeWindowDays}d: ${prevShare}% → Current ${summary.timeWindowDays}d: ${currShare}%`);

  const iconSpan = document.createElement('span');
  iconSpan.className = 'ownership-radar-icon';
  iconSpan.textContent = getTrendIcon(summary.trend.trendDirection);

  const textSpan = document.createElement('span');
  textSpan.className = 'ownership-radar-text';
  textSpan.textContent = summary.formattedSummary;

  badge.appendChild(iconSpan);
  badge.appendChild(document.createTextNode(' '));
  badge.appendChild(textSpan);

  return badge;
}

export function createOwnershipTrendCard(summaries: TrendSummary[], title = 'Ownership Trends'): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ownership-radar-card';

  const header = document.createElement('h4');
  header.className = 'ownership-radar-card-header';
  header.textContent = title;
  container.appendChild(header);

  if (summaries.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'ownership-radar-empty';
    emptyMsg.textContent = 'No ownership trends detected.';
    container.appendChild(emptyMsg);
    return container;
  }

  const list = document.createElement('ul');
  list.className = 'ownership-radar-trend-list';

  for (const summary of summaries) {
    const listItem = document.createElement('li');
    listItem.className = 'ownership-radar-trend-item';
    const badge = createOwnershipTrendBadge(summary);
    listItem.appendChild(badge);
    list.appendChild(listItem);
  }

  container.appendChild(list);
  return container;
}

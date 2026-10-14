import { describe, expect, it } from 'vitest';
import { TrendSummary } from '../src/types.js';
import { createOwnershipTrendBadge, createOwnershipTrendCard, getTrendCssClass, getTrendIcon } from '../src/ui/trendView.js';

describe('UI Trend Component Renderer', () => {
  const mockIncreasedSummary: TrendSummary = {
    author: 'Alexandre',
    module: 'tax module',
    timeWindowDays: 30,
    formattedSummary: 'Alexandre’s ownership of tax module increased 30% in last 30 days',
    trend: {
      author: 'Alexandre',
      module: 'tax module',
      timeWindowDays: 30,
      currentOwnershipShare: 0.8,
      previousOwnershipShare: 0.5,
      absoluteChangeShare: 0.3,
      percentagePointsChange: 30,
      trendDirection: 'increased',
      currentPeriodContributions: {
        author: 'Alexandre',
        module: 'tax module',
        commitsCount: 8,
        linesAdded: 80,
        linesDeleted: 0,
        totalLinesChanged: 80,
      },
      previousPeriodContributions: {
        author: 'Alexandre',
        module: 'tax module',
        commitsCount: 5,
        linesAdded: 50,
        linesDeleted: 0,
        totalLinesChanged: 50,
      },
    },
  };

  it('should return correct icons and css classes', () => {
    expect(getTrendIcon('increased')).toBe('📈');
    expect(getTrendIcon('decreased')).toBe('📉');
    expect(getTrendIcon('unchanged')).toBe('➖');

    expect(getTrendCssClass('increased')).toBe('ownership-trend-increased');
    expect(getTrendCssClass('decreased')).toBe('ownership-trend-decreased');
    expect(getTrendCssClass('unchanged')).toBe('ownership-trend-unchanged');
  });

  it('should render a trend badge DOM element with metadata and text', () => {
    const badge = createOwnershipTrendBadge(mockIncreasedSummary);

    expect(badge.className).toContain('ownership-radar-badge');
    expect(badge.className).toContain('ownership-trend-increased');
    expect(badge.getAttribute('data-author')).toBe('Alexandre');
    expect(badge.getAttribute('data-module')).toBe('tax module');
    expect(badge.getAttribute('data-direction')).toBe('increased');
    expect(badge.getAttribute('data-change-percent')).toBe('30');
    expect(badge.getAttribute('title')).toBe('Previous 30d: 50% → Current 30d: 80%');

    expect(badge.textContent).toContain('📈');
    expect(badge.textContent).toContain('Alexandre’s ownership of tax module increased 30% in last 30 days');
  });

  it('should render a trend card with list of badges', () => {
    const card = createOwnershipTrendCard([mockIncreasedSummary], 'Module Ownership Trends');

    expect(card.className).toBe('ownership-radar-card');
    const header = card.querySelector('.ownership-radar-card-header');
    expect(header?.textContent).toBe('Module Ownership Trends');

    const items = card.querySelectorAll('.ownership-radar-trend-item');
    expect(items.length).toBe(1);

    const badge = items[0].querySelector('.ownership-radar-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toContain('Alexandre’s ownership of tax module increased 30% in last 30 days');
  });

  it('should render empty state message when no summaries are provided', () => {
    const card = createOwnershipTrendCard([]);
    const emptyMsg = card.querySelector('.ownership-radar-empty');
    expect(emptyMsg?.textContent).toBe('No ownership trends detected.');
  });
});

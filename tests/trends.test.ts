import { describe, expect, it } from 'vitest';
import { Commit } from '../src/types.js';
import { calculateOwnershipTrend, formatTrendSummary, analyzeOwnershipTrends } from '../src/trends.js';

describe('Ownership Trends Analyzer', () => {
  const refDate = new Date('2026-10-14T12:00:00Z');
  const msPerDay = 24 * 60 * 60 * 1000;

  function createCommit(author: string, moduleName: string, daysAgo: number, commitsCount = 1, linesAdded = 10): Commit {
    const timestamp = new Date(refDate.getTime() - daysAgo * msPerDay);
    return {
      author,
      module: moduleName,
      timestamp,
      commitsCount,
      linesAdded,
      linesDeleted: 0,
    };
  }

  it("should calculate an increase in ownership (e.g., Alexandre's ownership of tax module increased 30% in last 30 days)", () => {
    const commits: Commit[] = [];

    // Previous 30 days (days 31 to 60 ago): Alexandre 5 commits, Bob 5 commits => 50% ownership
    for (let i = 0; i < 5; i++) {
      commits.push(createCommit('Alexandre', 'tax module', 40));
      commits.push(createCommit('Bob', 'tax module', 40));
    }

    // Current 30 days (days 0 to 30 ago): Alexandre 8 commits, Bob 2 commits => 80% ownership
    for (let i = 0; i < 8; i++) {
      commits.push(createCommit('Alexandre', 'tax module', 10));
    }
    for (let i = 0; i < 2; i++) {
      commits.push(createCommit('Bob', 'tax module', 10));
    }

    const trend = calculateOwnershipTrend(commits, 'Alexandre', 'tax module', {
      asOfDate: refDate,
      windowDays: 30,
      metric: 'commits',
    });

    expect(trend.author).toBe('Alexandre');
    expect(trend.module).toBe('tax module');
    expect(trend.previousOwnershipShare).toBeCloseTo(0.5);
    expect(trend.currentOwnershipShare).toBeCloseTo(0.8);
    expect(trend.percentagePointsChange).toBe(30);
    expect(trend.trendDirection).toBe('increased');

    const summary = formatTrendSummary(trend);
    expect(summary.formattedSummary).toBe('Alexandre’s ownership of tax module increased 30% in last 30 days');
  });

  it('should calculate a decrease in ownership', () => {
    const commits: Commit[] = [];

    // Previous 30 days: Alexandre 7 commits out of 10 (70%)
    for (let i = 0; i < 7; i++) commits.push(createCommit('Alexandre', 'billing', 45));
    for (let i = 0; i < 3; i++) commits.push(createCommit('Charlie', 'billing', 45));

    // Current 30 days: Alexandre 2 commits out of 10 (20%)
    for (let i = 0; i < 2; i++) commits.push(createCommit('Alexandre', 'billing', 15));
    for (let i = 0; i < 8; i++) commits.push(createCommit('Charlie', 'billing', 15));

    const trend = calculateOwnershipTrend(commits, 'Alexandre', 'billing', {
      asOfDate: refDate,
      windowDays: 30,
    });

    expect(trend.trendDirection).toBe('decreased');
    expect(trend.percentagePointsChange).toBe(50);

    const summary = formatTrendSummary(trend);
    expect(summary.formattedSummary).toBe('Alexandre’s ownership of billing decreased 50% in last 30 days');
  });

  it('should calculate unchanged ownership', () => {
    const commits: Commit[] = [];

    // Previous 30 days: Alexandre 5 / 10 = 50%
    for (let i = 0; i < 5; i++) commits.push(createCommit('Alexandre', 'auth', 40));
    for (let i = 0; i < 5; i++) commits.push(createCommit('David', 'auth', 40));

    // Current 30 days: Alexandre 5 / 10 = 50%
    for (let i = 0; i < 5; i++) commits.push(createCommit('Alexandre', 'auth', 10));
    for (let i = 0; i < 5; i++) commits.push(createCommit('David', 'auth', 10));

    const trend = calculateOwnershipTrend(commits, 'Alexandre', 'auth', {
      asOfDate: refDate,
      windowDays: 30,
    });

    expect(trend.trendDirection).toBe('unchanged');
    expect(trend.percentagePointsChange).toBe(0);

    const summary = formatTrendSummary(trend);
    expect(summary.formattedSummary).toBe('Alexandre’s ownership of auth remained unchanged (50%) in last 30 days');
  });

  it('should support custom windowDays (e.g. 14 days)', () => {
    const commits: Commit[] = [];

    // Previous 14 days (days 15 to 28 ago): Alexandre 1 / 4 = 25%
    commits.push(createCommit('Alexandre', 'frontend', 20));
    commits.push(createCommit('Eva', 'frontend', 20, 3));

    // Current 14 days (days 0 to 14 ago): Alexandre 3 / 4 = 75%
    commits.push(createCommit('Alexandre', 'frontend', 5, 3));
    commits.push(createCommit('Eva', 'frontend', 5));

    const trend = calculateOwnershipTrend(commits, 'Alexandre', 'frontend', {
      asOfDate: refDate,
      windowDays: 14,
    });

    expect(trend.timeWindowDays).toBe(14);
    expect(trend.percentagePointsChange).toBe(50);
    const summary = formatTrendSummary(trend);
    expect(summary.formattedSummary).toBe('Alexandre’s ownership of frontend increased 50% in last 14 days');
  });

  it('should calculate trends using linesChanged metric', () => {
    const commits: Commit[] = [
      // Previous window: Alexandre added 100 lines out of 200 total (50%)
      createCommit('Alexandre', 'tax module', 40, 1, 100),
      createCommit('Bob', 'tax module', 40, 1, 100),
      // Current window: Alexandre added 900 lines out of 1000 total (90%)
      createCommit('Alexandre', 'tax module', 10, 1, 900),
      createCommit('Bob', 'tax module', 10, 1, 100),
    ];

    const trend = calculateOwnershipTrend(commits, 'Alexandre', 'tax module', {
      asOfDate: refDate,
      windowDays: 30,
      metric: 'linesChanged',
    });

    expect(trend.previousOwnershipShare).toBeCloseTo(0.5);
    expect(trend.currentOwnershipShare).toBeCloseTo(0.9);
    expect(trend.percentagePointsChange).toBe(40);
  });

  it('should handle analyzeOwnershipTrends for multiple author-module combinations', () => {
    const commits: Commit[] = [
      createCommit('Alexandre', 'tax module', 40),
      createCommit('Bob', 'tax module', 40),
      createCommit('Alexandre', 'tax module', 10, 4),
      createCommit('Charlie', 'api', 10, 2),
    ];

    const summaries = analyzeOwnershipTrends(commits, { asOfDate: refDate, windowDays: 30 });
    expect(summaries.length).toBeGreaterThanOrEqual(3);
    const alexandreTax = summaries.find((s) => s.author === 'Alexandre' && s.module === 'tax module');
    expect(alexandreTax).toBeDefined();
    expect(alexandreTax?.formattedSummary).toContain('Alexandre’s ownership of tax module');
  });
});

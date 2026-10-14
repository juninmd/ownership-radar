import { describe, it, expect } from 'vitest';
import { recommendReviewers, calculateRecencyWeight, buildFileOwnershipSummaries } from '../src/ownership.js';
import { renderReviewerRadarWidget } from '../src/content.js';
import { Commit } from '../src/types.js';

describe('calculateRecencyWeight', () => {
  it('should return 1 for today commit', () => {
    const now = new Date('2025-01-01T00:00:00Z');
    const weight = calculateRecencyWeight('2025-01-01T00:00:00Z', now, 90);
    expect(weight).toBeCloseTo(1.0);
  });

  it('should return 0.5 for commit 90 days ago with 90 days halfLife', () => {
    const now = new Date('2025-04-01T00:00:00Z');
    const weight = calculateRecencyWeight('2025-01-01T00:00:00Z', now, 90);
    expect(weight).toBeCloseTo(0.5, 2);
  });
});

describe('buildFileOwnershipSummaries', () => {
  it('should correctly aggregate commits per file and author', () => {
    const commits: Commit[] = [
      { hash: '1', author: 'alice', date: '2025-01-01T00:00:00Z', filename: 'src/main.ts', additions: 10 },
      { hash: '2', author: 'bob', date: '2025-01-02T00:00:00Z', filename: 'src/main.ts', additions: 5 },
      { hash: '3', author: 'alice', date: '2025-01-03T00:00:00Z', filename: 'src/main.ts', additions: 15 },
    ];

    const summaries = buildFileOwnershipSummaries(commits);
    expect(summaries['src/main.ts'].totalCommits).toBe(3);
    expect(summaries['src/main.ts'].authorCommits['alice']).toBe(2);
    expect(summaries['src/main.ts'].authorCommits['bob']).toBe(1);
    expect(summaries['src/main.ts'].authorAdditions['alice']).toBe(25);
  });
});

describe('recommendReviewers', () => {
  const commits: Commit[] = [
    { hash: 'c1', author: 'alice', date: '2025-01-10T00:00:00Z', filename: 'src/auth.ts' },
    { hash: 'c2', author: 'alice', date: '2025-01-11T00:00:00Z', filename: 'src/auth.ts' },
    { hash: 'c3', author: 'bob', date: '2025-01-05T00:00:00Z', filename: 'src/auth.ts' },
    { hash: 'c4', author: 'charlie', date: '2024-01-01T00:00:00Z', filename: 'src/auth.ts' }, // Old commit
    { hash: 'c5', author: 'dave', date: '2025-01-12T00:00:00Z', filename: 'src/utils.ts' },
  ];

  it('should rank reviewers based on weighted recency and file ownership', () => {
    const suggestions = recommendReviewers(['src/auth.ts'], commits);

    expect(suggestions.length).toBe(3);
    expect(suggestions[0].username).toBe('alice');
    expect(suggestions[0].ownershipPercentage).toBeGreaterThan(0);
    expect(suggestions[0].explanations.length).toBeGreaterThan(0);
  });

  it('should exclude PR author from suggestions', () => {
    const suggestions = recommendReviewers(['src/auth.ts'], commits, { prAuthor: 'alice' });

    expect(suggestions.find((s) => s.username === 'alice')).toBeUndefined();
    expect(suggestions[0].username).toBe('bob');
  });

  it('should return empty list when no authors exist for changed files', () => {
    const suggestions = recommendReviewers(['src/nonexistent.ts'], commits);
    expect(suggestions).toEqual([]);
  });
});

describe('renderReviewerRadarWidget', () => {
  it('should render widget DOM element correctly', () => {
    const suggestions = [
      {
        username: 'alice',
        score: 1.8,
        ownershipPercentage: 67,
        recentCommitsCount: 2,
        lastActiveDate: '2025-01-11T00:00:00Z',
        explanations: [
          'Authored 67% of past changes across 1 touched file(s)',
          'Primary maintainer for `src/auth.ts` (67% ownership, 2 commits)',
        ],
        fileBreakdown: [
          {
            filename: 'src/auth.ts',
            commitsInFile: 2,
            totalFileCommits: 3,
            lastCommitDate: '2025-01-11T00:00:00Z',
          },
        ],
      },
    ];

    const element = renderReviewerRadarWidget(suggestions);
    expect(element.className).toContain('ownership-radar-widget');
    expect(element.innerHTML).toContain('@alice');
    expect(element.innerHTML).toContain('67% ownership');
    expect(element.innerHTML).toContain('Primary maintainer for `src/auth.ts`');
  });
});

import { describe, it, expect } from 'vitest';
import { calculateOwnership } from '../src/ownership';
import { CommitInfo, PackageInfo } from '../src/types';

describe('Ownership Calculation with Monorepo Scoping', () => {
  const packages: PackageInfo[] = [
    { name: 'ui', rootPath: 'packages/ui' },
    { name: 'api', rootPath: 'packages/api' },
  ];

  const commits: CommitInfo[] = [
    {
      hash: 'c1',
      author: 'alice',
      date: '2023-01-01',
      filesChanged: [
        { path: 'packages/ui/src/Button.tsx', additions: 10, deletions: 0 },
        { path: 'packages/ui/src/Header.tsx', additions: 20, deletions: 5 },
      ],
    },
    {
      hash: 'c2',
      author: 'bob',
      date: '2023-01-02',
      filesChanged: [
        { path: 'packages/ui/src/Button.tsx', additions: 5, deletions: 2 },
      ],
    },
    {
      hash: 'c3',
      author: 'charlie',
      date: '2023-01-03',
      filesChanged: [
        { path: 'packages/api/src/server.ts', additions: 50, deletions: 0 },
      ],
    },
  ];

  it('calculates package-scoped ownership for monorepo package files', () => {
    const result = calculateOwnership('packages/ui/src/Button.tsx', commits, {
      scopeToPackage: true,
      packages,
    });

    expect(result.packageName).toBe('ui');
    expect(result.isMonorepoScoped).toBe(true);
    expect(result.topOwner?.author).toBe('alice'); // alice has 1 commit on Header + 1 commit on Button = 2 commits in package ui
    expect(result.owners).toHaveLength(2);
    expect(result.topOwner?.whyExplanation).toContain("package 'ui'");
  });

  it('calculates file-scoped ownership when scopeToPackage is false', () => {
    const result = calculateOwnership('packages/ui/src/Button.tsx', commits, {
      scopeToPackage: false,
      packages,
    });

    expect(result.isMonorepoScoped).toBe(false);
    expect(result.owners).toHaveLength(2); // 1 commit each for alice and bob on Button.tsx
    expect(result.topOwner?.whyExplanation).toContain("path 'packages/ui/src/Button.tsx'");
  });
});

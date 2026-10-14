import test from 'node:test';
import assert from 'node:assert/strict';
import { detectOwnershipSync } from '../src/syncDetector.js';

test('detectOwnershipSync identifies fully in-sync repository', () => {
  const codeownersContent = `
/src/ @alice @bob
/docs/ @charlie
`;

  const actualOwnership = {
    'src/index.js': ['@alice'],
    'src/component.js': ['@bob'],
    'docs/README.md': ['@charlie']
  };

  const result = detectOwnershipSync({
    codeownersContent,
    actualOwnership,
    threshold: 0.2
  });

  assert.equal(result.isOutOfSync, false);
  assert.equal(result.divergenceScore, 0);
  assert.equal(result.divergencePercentage, 0);
  assert.equal(result.totalFiles, 3);
  assert.equal(result.divergedFilesCount, 0);
});

test('detectOwnershipSync flags significantly out-of-sync repository', () => {
  const codeownersContent = `
/src/ @alice
`;

  const actualOwnership = {
    'src/index.js': ['@bob'],      // Diverged (0.5)
    'src/component.js': ['@alice'] // Synced
  };

  const result = detectOwnershipSync({
    codeownersContent,
    actualOwnership,
    threshold: 0.2
  });

  assert.equal(result.isOutOfSync, true);
  assert.equal(result.divergenceScore, 0.5);
  assert.equal(result.divergencePercentage, 50);
  assert.equal(result.divergedFilesCount, 1);
  assert.equal(result.syncedFilesCount, 1);
  assert.equal(result.details.length, 2);
});

test('detectOwnershipSync respects custom divergence threshold', () => {
  const codeownersContent = `
/src/ @alice
`;

  const actualOwnership = {
    'src/index.js': ['@bob'],       // Diverged
    'src/a.js': ['@alice'],
    'src/b.js': ['@alice'],
    'src/c.js': ['@alice'],
    'src/d.js': ['@alice']
  };

  // 1 out of 5 diverged = 20% divergence
  const resultLowThreshold = detectOwnershipSync({
    codeownersContent,
    actualOwnership,
    threshold: 0.15 // 15% threshold -> out of sync
  });
  assert.equal(resultLowThreshold.isOutOfSync, true);

  const resultHighThreshold = detectOwnershipSync({
    codeownersContent,
    actualOwnership,
    threshold: 0.25 // 25% threshold -> in sync
  });
  assert.equal(resultHighThreshold.isOutOfSync, false);
});

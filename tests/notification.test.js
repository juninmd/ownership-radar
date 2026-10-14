import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSyncNotification } from '../src/notification.js';
import { checkCodeownersSync } from '../src/index.js';

test('generateSyncNotification outputs warning notification when out of sync', () => {
  const syncResult = {
    isOutOfSync: true,
    divergenceScore: 0.5,
    divergencePercentage: 50,
    threshold: 0.2,
    totalFiles: 4,
    divergedFilesCount: 2,
    syncedFilesCount: 2,
    details: [
      {
        path: 'src/old.js',
        declaredOwners: ['@former-dev'],
        actualOwners: ['@new-dev'],
        inSync: false,
        reason: 'OWNER_MISMATCH'
      },
      {
        path: 'src/new-feature.js',
        declaredOwners: [],
        actualOwners: ['@new-dev'],
        inSync: false,
        reason: 'UNOWNED'
      }
    ]
  };

  const notification = generateSyncNotification(syncResult, { format: 'markdown' });

  assert.equal(notification.level, 'warning');
  assert.equal(notification.isOutOfSync, true);
  assert.ok(notification.title.includes('50% divergence'));
  assert.ok(notification.body.includes('`src/old.js`'));
  assert.ok(notification.body.includes('@former-dev'));
  assert.ok(notification.body.includes('@new-dev'));
});

test('checkCodeownersSync entry point returns combined result and notification', () => {
  const result = checkCodeownersSync({
    codeownersContent: '/src/ @alice',
    actualOwnership: {
      'src/a.js': ['@bob'],
      'src/b.js': ['@alice']
    },
    threshold: 0.2
  });

  assert.equal(result.isOutOfSync, true);
  assert.equal(result.divergencePercentage, 50);
  assert.ok(result.notification);
  assert.equal(result.notification.level, 'warning');
});

import { parseCodeowners, getOwnersForPath, patternToRegex } from './codeowners.js';
import { detectOwnershipSync } from './syncDetector.js';
import { generateSyncNotification } from './notification.js';

/**
 * Main function to evaluate CODEOWNERS sync and generate a notification if out of sync.
 *
 * @param {Object} params
 * @param {string} params.codeownersContent - Raw content of CODEOWNERS file
 * @param {Object<string, string[]>|Array<{path: string, owners: string[]}>} params.actualOwnership - Actual file ownership data
 * @param {number} [params.threshold=0.2] - Out-of-sync threshold fraction (0 to 1)
 * @param {string} [params.format='markdown'] - Format for notification body ('markdown', 'html', 'plain')
 * @returns {Object} Combined detection result and notification
 */
export function checkCodeownersSync({
  codeownersContent,
  actualOwnership,
  threshold = 0.2,
  format = 'markdown'
}) {
  const syncResult = detectOwnershipSync({
    codeownersContent,
    actualOwnership,
    threshold
  });

  const notification = generateSyncNotification(syncResult, { format });

  return {
    ...syncResult,
    notification
  };
}

export {
  parseCodeowners,
  getOwnersForPath,
  patternToRegex,
  detectOwnershipSync,
  generateSyncNotification
};

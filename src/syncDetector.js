import { parseCodeowners, getOwnersForPath } from './codeowners.js';

/**
 * Normalizes username by removing leading '@' and lowercasing.
 * @param {string} handle
 * @returns {string}
 */
function normalizeHandle(handle) {
  if (!handle) return '';
  return handle.trim().toLowerCase().replace(/^@/, '');
}

/**
 * Checks if two sets of owners overlap significantly or are equivalent.
 * @param {string[]} declaredOwners
 * @param {string[]} actualOwners
 * @returns {boolean}
 */
function areOwnersInSync(declaredOwners, actualOwners) {
  if ((!declaredOwners || declaredOwners.length === 0) && (!actualOwners || actualOwners.length === 0)) {
    return true;
  }
  if (!declaredOwners || declaredOwners.length === 0) return false;
  if (!actualOwners || actualOwners.length === 0) return false;

  const normDeclared = declaredOwners.map(normalizeHandle);
  const normActual = actualOwners.map(normalizeHandle);

  // Check if at least one actual owner is declared OR declared owner is in actual owners
  const hasOverlap = normActual.some(owner => normDeclared.includes(owner));
  return hasOverlap;
}

/**
 * Evaluates sync state between CODEOWNERS content and actual file ownership data.
 *
 * @param {Object} options
 * @param {string} options.codeownersContent - The raw CODEOWNERS file content
 * @param {Object<string, string[]>|Array<{path: string, owners: string[]}>} options.actualOwnership - Actual ownership mapping (path -> actual owner list or objects)
 * @param {number} [options.threshold=0.2] - Divergence threshold (0 to 1, e.g. 0.20 = 20%)
 * @returns {Object} Analysis result
 */
export function detectOwnershipSync({
  codeownersContent,
  actualOwnership,
  threshold = 0.2
}) {
  const rules = parseCodeowners(codeownersContent || '');

  // Normalize actualOwnership into an array of { path, owners }
  let actualEntries = [];
  if (Array.isArray(actualOwnership)) {
    actualEntries = actualOwnership;
  } else if (actualOwnership && typeof actualOwnership === 'object') {
    actualEntries = Object.entries(actualOwnership).map(([path, owners]) => ({
      path,
      owners: Array.isArray(owners) ? owners : [owners]
    }));
  }

  const totalFiles = actualEntries.length;
  if (totalFiles === 0) {
    return {
      isOutOfSync: false,
      divergenceScore: 0,
      divergencePercentage: 0,
      threshold,
      totalFiles: 0,
      divergedFilesCount: 0,
      syncedFilesCount: 0,
      details: []
    };
  }

  let divergedFilesCount = 0;
  const details = [];

  for (const entry of actualEntries) {
    const path = entry.path;
    const actualOwners = entry.owners || [];
    const declaredOwners = getOwnersForPath(rules, path);

    const inSync = areOwnersInSync(declaredOwners, actualOwners);

    if (!inSync) {
      divergedFilesCount++;
    }

    details.push({
      path,
      declaredOwners,
      actualOwners,
      inSync,
      reason: !declaredOwners || declaredOwners.length === 0
        ? 'UNOWNED'
        : (!inSync ? 'OWNER_MISMATCH' : 'IN_SYNC')
    });
  }

  const divergenceScore = divergedFilesCount / totalFiles;
  const divergencePercentage = Math.round(divergenceScore * 100);
  const isOutOfSync = divergenceScore >= threshold;

  return {
    isOutOfSync,
    divergenceScore,
    divergencePercentage,
    threshold,
    totalFiles,
    divergedFilesCount,
    syncedFilesCount: totalFiles - divergedFilesCount,
    details
  };
}

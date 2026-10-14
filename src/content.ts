import { detectPackagesFromPaths } from './monorepo';
import { calculateOwnership } from './ownership';
import { createOwnershipBadge } from './ui';
import { CommitInfo } from './types';

/**
 * Parses current GitHub URL to extract file/folder path.
 */
export function extractFilePathFromUrl(url: string): string | null {
  const match = url.match(/github\.com\/[^/]+\/[^/]+\/(?:tree|blob)\/[^/]+\/(.+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Initializes Ownership Radar content script on GitHub page load.
 */
export function initOwnershipRadar(currentUrl: string = window.location.href, mockCommits: CommitInfo[] = []): void {
  const filePath = extractFilePathFromUrl(currentUrl);
  if (!filePath) return;

  // Infer package structure from sample paths or commits
  const commitPaths = mockCommits.flatMap((c) => c.filesChanged.map((f) => f.path));
  const detectedPackages = detectPackagesFromPaths([filePath, ...commitPaths]);

  const ownershipResult = calculateOwnership(filePath, mockCommits, {
    scopeToPackage: true,
    packages: detectedPackages,
  });

  const badge = createOwnershipBadge(ownershipResult);

  // Inject into page header or sidebar if available in DOM
  const targetContainer = document.querySelector('.gh-header-actions, .repository-content, body');
  if (targetContainer) {
    targetContainer.prepend(badge);
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initOwnershipRadar();
}

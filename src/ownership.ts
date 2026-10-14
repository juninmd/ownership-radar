import { CommitInfo, FileOwnershipResult, PackageInfo, OwnershipScore } from './types';
import { findPackageForPath, normalizePath } from './monorepo';

export interface OwnershipOptions {
  /**
   * If true, restricts analysis to commits touching the enclosing package scope when inside a monorepo package.
   */
  scopeToPackage?: boolean;
  /**
   * Reference date for recency calculation (defaults to current date or latest commit date).
   */
  referenceDate?: Date;
  /**
   * Optional explicit package list.
   */
  packages?: PackageInfo[];
}

/**
 * Calculates ownership for a target file or path based on commit history,
 * with optional scoping to monorepo package boundaries.
 */
export function calculateOwnership(
  filePath: string,
  commits: CommitInfo[],
  options: OwnershipOptions = {}
): FileOwnershipResult {
  const normTarget = normalizePath(filePath);
  const scopeToPackage = options.scopeToPackage ?? true;
  const packages = options.packages ?? [];

  const matchedPackage = findPackageForPath(normTarget, packages);

  // Filter commits based on path matching and scope
  const authorStats = new Map<string, { commitCount: number; linesChanged: number; lastCommitDate?: Date }>();

  for (const commit of commits) {
    const commitDate = typeof commit.date === 'string' ? new Date(commit.date) : commit.date;

    for (const change of commit.filesChanged) {
      const normChangePath = normalizePath(change.path);

      let isRelevant = false;

      if (matchedPackage && scopeToPackage) {
        // Scope ownership analysis to changes within the same package root
        const pkgRoot = normalizePath(matchedPackage.rootPath);
        if (normChangePath === pkgRoot || normChangePath.startsWith(pkgRoot + '/')) {
          isRelevant = true;
        }
      } else {
        // Scope ownership analysis to exact path or path prefix (folder analysis)
        if (normChangePath === normTarget || normChangePath.startsWith(normTarget + '/')) {
          isRelevant = true;
        }
      }

      if (isRelevant) {
        const stats = authorStats.get(commit.author) || {
          commitCount: 0,
          linesChanged: 0,
          lastCommitDate: undefined,
        };

        stats.commitCount += 1;
        stats.linesChanged += (change.additions || 0) + (change.deletions || 0);
        if (!stats.lastCommitDate || commitDate > stats.lastCommitDate) {
          stats.lastCommitDate = commitDate;
        }

        authorStats.set(commit.author, stats);
      }
    }
  }

  // Calculate scores and explanations
  const totalCommits = Array.from(authorStats.values()).reduce((sum, s) => sum + s.commitCount, 0);

  const owners: OwnershipScore[] = Array.from(authorStats.entries())
    .map(([author, stats]) => {
      // Score composite of commit frequency percentage + lines changed contribution
      const commitPct = totalCommits > 0 ? (stats.commitCount / totalCommits) * 100 : 0;
      const score = Math.round(commitPct);

      let scopeLabel = matchedPackage && scopeToPackage ? `package '${matchedPackage.name}'` : `path '${normTarget}'`;
      let whyExplanation = `${author} made ${stats.commitCount} commit(s) (${score}% of activity) in ${scopeLabel}. Total lines changed: ${stats.linesChanged}.`;

      return {
        author,
        score,
        commitCount: stats.commitCount,
        linesChanged: stats.linesChanged,
        lastCommitDate: stats.lastCommitDate,
        whyExplanation,
      };
    })
    .sort((a, b) => b.score - a.score || b.commitCount - a.commitCount);

  return {
    filePath: normTarget,
    packageName: matchedPackage?.name,
    packageRoot: matchedPackage?.rootPath,
    topOwner: owners[0],
    owners,
    isMonorepoScoped: Boolean(matchedPackage && scopeToPackage),
  };
}

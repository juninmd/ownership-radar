import { Commit, CommitInfo, FileOwnershipResult, FileOwnershipSummary, PackageInfo, OwnershipScore, ReviewerSuggestion, AnalyzeOptions } from './types.js';
import { findPackageForPath, normalizePath } from './monorepo.js';


/**
 * Calculates exponential recency decay weight based on commit date relative to reference date (now).
 * Weight = 0.5 ^ (daysAgo / halfLifeDays)
 */
export function calculateRecencyWeight(commitDateStr: string, referenceDate: Date = new Date(), halfLifeDays: number = 90): number {
  const commitDate = new Date(commitDateStr);
  const diffTime = Math.max(0, referenceDate.getTime() - commitDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, diffDays / halfLifeDays);
}

/**
 * Aggregates ownership metrics per file.
 */
export function buildFileOwnershipSummaries(commits: Commit[]): Record<string, FileOwnershipSummary> {
  const summaries: Record<string, FileOwnershipSummary> = {};

  for (const commit of commits) {
    if (!summaries[commit.filename]) {
      summaries[commit.filename] = {
        filename: commit.filename,
        totalCommits: 0,
        authorCommits: {},
        authorLastCommitDate: {},
        authorAdditions: {},
      };
    }

    const summary = summaries[commit.filename];
    summary.totalCommits += 1;

    const author = commit.author;
    summary.authorCommits[author] = (summary.authorCommits[author] || 0) + 1;

    if (commit.additions) {
      summary.authorAdditions[author] = (summary.authorAdditions[author] || 0) + commit.additions;
    }

    const existingLastDate = summary.authorLastCommitDate[author];
    if (!existingLastDate || new Date(commit.date) > new Date(existingLastDate)) {
      summary.authorLastCommitDate[author] = commit.date;
    }
  }

  return summaries;
}

/**
 * Main algorithm to recommend reviewers based on file ownership and recent collaboration.
 */
export function recommendReviewers(
  changedFiles: string[],
  commitHistory: Commit[],
  options: AnalyzeOptions = {}
): ReviewerSuggestion[] {
  const { prAuthor, halfLifeDays = 90, maxSuggestions = 5 } = options;
  const now = new Date();

  // Filter out PR author if provided
  const relevantCommits = commitHistory.filter((commit) => changedFiles.includes(commit.filename));

  const authorScores: Record<
    string,
    {
      weightedScore: number;
      totalCommits: number;
      recentCommits: number; // Commits in last 90 days
      lastActiveDate: string | null;
      fileBreakdown: Record<
        string,
        {
          commitsInFile: number;
          lastCommitDate: string;
        }
      >;
    }
  > = {};

  const fileTotals: Record<string, number> = {};

  for (const file of changedFiles) {
    fileTotals[file] = 0;
  }

  for (const commit of relevantCommits) {
    const author = commit.author;
    if (prAuthor && author.toLowerCase() === prAuthor.toLowerCase()) {
      continue;
    }

    fileTotals[commit.filename] = (fileTotals[commit.filename] || 0) + 1;

    if (!authorScores[author]) {
      authorScores[author] = {
        weightedScore: 0,
        totalCommits: 0,
        recentCommits: 0,
        lastActiveDate: null,
        fileBreakdown: {},
      };
    }

    const stats = authorScores[author];
    const recencyWeight = calculateRecencyWeight(commit.date, now, halfLifeDays);

    stats.weightedScore += recencyWeight;
    stats.totalCommits += 1;

    const commitDate = new Date(commit.date);
    const daysAgo = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 90) {
      stats.recentCommits += 1;
    }

    if (!stats.lastActiveDate || commitDate > new Date(stats.lastActiveDate)) {
      stats.lastActiveDate = commit.date;
    }

    if (!stats.fileBreakdown[commit.filename]) {
      stats.fileBreakdown[commit.filename] = {
        commitsInFile: 0,
        lastCommitDate: commit.date,
      };
    }

    const fb = stats.fileBreakdown[commit.filename];
    fb.commitsInFile += 1;
    if (commitDate > new Date(fb.lastCommitDate)) {
      fb.lastCommitDate = commit.date;
    }
  }

  const suggestions: ReviewerSuggestion[] = [];

  for (const [author, stats] of Object.entries(authorScores)) {
    const totalPRFileCommits = Object.values(fileTotals).reduce((a, b) => a + b, 0);
    const ownershipPercentage = totalPRFileCommits > 0 ? Math.round((stats.totalCommits / totalPRFileCommits) * 100) : 0;

    const fileBreakdownList = Object.entries(stats.fileBreakdown).map(([filename, fb]) => ({
      filename,
      commitsInFile: fb.commitsInFile,
      totalFileCommits: fileTotals[filename] || fb.commitsInFile,
      lastCommitDate: fb.lastCommitDate,
    }));

    const explanations: string[] = [];

    // Ownership explanations
    if (ownershipPercentage > 0) {
      explanations.push(`Authored ${ownershipPercentage}% of past changes across ${fileBreakdownList.length} touched file(s)`);
    }

    // Top file explanation
    const topFile = [...fileBreakdownList].sort((a, b) => b.commitsInFile - a.commitsInFile)[0];
    if (topFile) {
      const fileOwnershipPct = Math.round((topFile.commitsInFile / topFile.totalFileCommits) * 100);
      explanations.push(`Primary maintainer for \`${topFile.filename}\` (${fileOwnershipPct}% ownership, ${topFile.commitsInFile} commits)`);
    }

    // Recency / collaboration explanation
    if (stats.recentCommits > 0) {
      explanations.push(`Recently active with ${stats.recentCommits} commit(s) on touched files in the last 90 days`);
    } else if (stats.lastActiveDate) {
      const daysSince = Math.floor((now.getTime() - new Date(stats.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24));
      explanations.push(`Last collaborated on touched files ${daysSince} days ago`);
    }

    suggestions.push({
      username: author,
      score: Math.round(stats.weightedScore * 100) / 100,
      ownershipPercentage,
      recentCommitsCount: stats.recentCommits,
      lastActiveDate: stats.lastActiveDate,
      explanations,
      fileBreakdown: fileBreakdownList,
    });
  }

  // Sort by weighted score descending
  suggestions.sort((a, b) => b.score - a.score);

  return suggestions.slice(0, maxSuggestions);
}


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
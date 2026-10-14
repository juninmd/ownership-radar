import { Commit, FileOwnershipSummary, ReviewerSuggestion, AnalyzeOptions } from './types.js';

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

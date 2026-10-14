import { Commit, ContributionWindowMetric, OwnershipMetricType } from './types.js';

export interface ModuleWindowAnalysis {
  windowMetricMap: Map<string, ContributionWindowMetric>; // key: author
  totalMetricValue: number;
}

export function parseDate(dateVal: Date | string | number): Date {
  if (dateVal instanceof Date) {
    return dateVal;
  }
  return new Date(dateVal);
}

export function getMetricValue(
  metric: ContributionWindowMetric,
  metricType: OwnershipMetricType = 'commits'
): number {
  switch (metricType) {
    case 'linesChanged':
      return metric.totalLinesChanged;
    case 'weighted':
      return metric.commitsCount * 10 + metric.totalLinesChanged;
    case 'commits':
    default:
      return metric.commitsCount;
  }
}

export function aggregateContributions(
  commits: Commit[],
  moduleFilter: string,
  startDate: Date,
  endDate: Date
): { authorMetrics: Map<string, ContributionWindowMetric>; totalMetric: Record<OwnershipMetricType, number> } {
  const authorMetrics = new Map<string, ContributionWindowMetric>();
  const totalMetric = {
    commits: 0,
    linesChanged: 0,
    weighted: 0,
  };

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  for (const commit of commits) {
    if (moduleFilter && commit.module.toLowerCase() !== moduleFilter.toLowerCase()) {
      continue;
    }

    const commitDate = parseDate(commit.timestamp);
    const commitMs = commitDate.getTime();

    // Include commits within window [startDate, endDate]
    if (commitMs < startMs || commitMs > endMs) {
      continue;
    }

    const author = commit.author;
    let existing = authorMetrics.get(author);
    if (!existing) {
      existing = {
        author,
        module: commit.module,
        commitsCount: 0,
        linesAdded: 0,
        linesDeleted: 0,
        totalLinesChanged: 0,
      };
      authorMetrics.set(author, existing);
    }

    const commitsCount = commit.commitsCount ?? 1;
    const linesAdded = commit.linesAdded ?? 0;
    const linesDeleted = commit.linesDeleted ?? 0;
    const totalLinesChanged = linesAdded + linesDeleted;

    existing.commitsCount += commitsCount;
    existing.linesAdded += linesAdded;
    existing.linesDeleted += linesDeleted;
    existing.totalLinesChanged += totalLinesChanged;

    totalMetric.commits += commitsCount;
    totalMetric.linesChanged += totalLinesChanged;
    totalMetric.weighted += commitsCount * 10 + totalLinesChanged;
  }

  return { authorMetrics, totalMetric };
}

export function calculateOwnershipShare(
  authorMetric: ContributionWindowMetric | undefined,
  totalModuleMetricValue: number,
  metricType: OwnershipMetricType = 'commits'
): number {
  if (!authorMetric || totalModuleMetricValue <= 0) {
    return 0;
  }
  const authorValue = getMetricValue(authorMetric, metricType);
  return Math.min(1, Math.max(0, authorValue / totalModuleMetricValue));
}

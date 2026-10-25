import {
  TrendCommit,
  ContributionWindowMetric,
  OwnershipTrend,
  TrendAnalysisOptions,
  TrendDirection,
  TrendSummary,
} from './types.js';
import { aggregateContributions, calculateOwnershipShare, parseDate } from './analyzer.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function emptyMetric(author: string, moduleName: string): ContributionWindowMetric {
  return {
    author,
    module: moduleName,
    commitsCount: 0,
    linesAdded: 0,
    linesDeleted: 0,
    totalLinesChanged: 0,
  };
}

export function determineAsOfDate(commits: TrendCommit[], explicitAsOf?: Date | string | number): Date {
  if (explicitAsOf) {
    return parseDate(explicitAsOf);
  }

  if (commits.length === 0) {
    return new Date();
  }

  let maxTime = -Infinity;
  for (const c of commits) {
    const t = parseDate(c.timestamp).getTime();
    if (t > maxTime) {
      maxTime = t;
    }
  }

  return maxTime === -Infinity ? new Date() : new Date(maxTime);
}

export function calculateOwnershipTrend(
  commits: TrendCommit[],
  author: string,
  moduleName: string,
  options: TrendAnalysisOptions = {}
): OwnershipTrend {
  const windowDays = options.windowDays ?? 30;
  const metricType = options.metric ?? 'commits';
  const asOfDate = determineAsOfDate(commits, options.asOfDate);

  const currentEnd = asOfDate;
  const currentStart = new Date(asOfDate.getTime() - windowDays * MS_PER_DAY);

  // Previous window is immediately before current window
  const previousEnd = new Date(currentStart.getTime() - 1); // 1 ms before current window start to avoid double counting
  const previousStart = new Date(previousEnd.getTime() - windowDays * MS_PER_DAY);

  const currentAgg = aggregateContributions(commits, moduleName, currentStart, currentEnd);
  const previousAgg = aggregateContributions(commits, moduleName, previousStart, previousEnd);

  const currentTotal = currentAgg.totalMetric[metricType];
  const previousTotal = previousAgg.totalMetric[metricType];

  const currentAuthorMetric = currentAgg.authorMetrics.get(author) ?? emptyMetric(author, moduleName);
  const previousAuthorMetric = previousAgg.authorMetrics.get(author) ?? emptyMetric(author, moduleName);

  const currentOwnershipShare = calculateOwnershipShare(currentAuthorMetric, currentTotal, metricType);
  const previousOwnershipShare = calculateOwnershipShare(previousAuthorMetric, previousTotal, metricType);

  const absoluteChangeShare = currentOwnershipShare - previousOwnershipShare;
  const percentagePointsChange = Math.round(Math.abs(absoluteChangeShare) * 100);

  let trendDirection: TrendDirection = 'unchanged';
  if (percentagePointsChange > 0) {
    trendDirection = absoluteChangeShare > 0 ? 'increased' : 'decreased';
  }

  return {
    author,
    module: moduleName,
    timeWindowDays: windowDays,
    currentOwnershipShare,
    previousOwnershipShare,
    absoluteChangeShare,
    percentagePointsChange,
    trendDirection,
    currentPeriodContributions: currentAuthorMetric,
    previousPeriodContributions: previousAuthorMetric,
  };
}

export function formatTrendSummary(trend: OwnershipTrend): TrendSummary {
  const { author, module: moduleName, timeWindowDays, trendDirection, percentagePointsChange, currentOwnershipShare } = trend;

  let formattedSummary = '';

  if (trendDirection === 'increased') {
    formattedSummary = `${author}’s ownership of ${moduleName} increased ${percentagePointsChange}% in last ${timeWindowDays} days`;
  } else if (trendDirection === 'decreased') {
    formattedSummary = `${author}’s ownership of ${moduleName} decreased ${percentagePointsChange}% in last ${timeWindowDays} days`;
  } else {
    const roundedShare = Math.round(currentOwnershipShare * 100);
    formattedSummary = `${author}’s ownership of ${moduleName} remained unchanged (${roundedShare}%) in last ${timeWindowDays} days`;
  }

  return {
    author,
    module: moduleName,
    timeWindowDays,
    trend,
    formattedSummary,
  };
}

export function analyzeOwnershipTrends(
  commits: TrendCommit[],
  options: TrendAnalysisOptions = {}
): TrendSummary[] {
  // Collect all unique author/module pairs
  const authorModulePairs = new Set<string>();

  for (const c of commits) {
    if (c.author && c.module) {
      authorModulePairs.add(`${c.author}|||${c.module}`);
    }
  }

  const summaries: TrendSummary[] = [];

  for (const pair of authorModulePairs) {
    const [author, moduleName] = pair.split('|||');
    const trend = calculateOwnershipTrend(commits, author, moduleName, options);
    summaries.push(formatTrendSummary(trend));
  }

  return summaries;
}

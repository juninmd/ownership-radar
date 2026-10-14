export interface Commit {
  hash?: string;
  author: string;
  module: string;
  timestamp: Date | string | number;
  linesAdded?: number;
  linesDeleted?: number;
  commitsCount?: number;
}

export interface ContributionWindowMetric {
  author: string;
  module: string;
  commitsCount: number;
  linesAdded: number;
  linesDeleted: number;
  totalLinesChanged: number;
}

export type OwnershipMetricType = 'commits' | 'linesChanged' | 'weighted';

export interface TrendAnalysisOptions {
  windowDays?: number;
  asOfDate?: Date | string | number;
  metric?: OwnershipMetricType;
}

export type TrendDirection = 'increased' | 'decreased' | 'unchanged';

export interface OwnershipTrend {
  author: string;
  module: string;
  timeWindowDays: number;
  currentOwnershipShare: number;
  previousOwnershipShare: number;
  absoluteChangeShare: number;
  percentagePointsChange: number;
  trendDirection: TrendDirection;
  currentPeriodContributions: ContributionWindowMetric;
  previousPeriodContributions: ContributionWindowMetric;
}

export interface TrendSummary {
  author: string;
  module: string;
  timeWindowDays: number;
  trend: OwnershipTrend;
  formattedSummary: string;
}

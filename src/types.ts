export type UserRole = 'member' | 'mentor' | 'lead';

export interface ContributorMetrics {
  username: string;
  commits: number; // Recent commits count
  linesChanged: number; // Net lines changed or total diff impact
  reviewsCount: number; // Number of PR reviews performed
  recencyDays: number; // Days since last contribution to the file/folder
  role?: UserRole; // Optional user role, e.g. 'mentor'
}

export interface MetricWeights {
  commits: number; // e.g. 0.4
  linesChanged: number; // e.g. 0.2
  reviewsCount: number; // e.g. 0.3
  recency: number; // e.g. 0.1
}

export interface RoleMultipliers {
  mentorReviewMultiplier: number; // e.g. 1.5x boost for mentor review counts
  mentorOverallMultiplier: number; // e.g. 1.0 (default) or 1.2
}

export interface WeightConfig {
  weights: MetricWeights;
  roleMultipliers: RoleMultipliers;
  customOverridesEnabled: boolean;
  leadUsername?: string;
  updatedAt?: string;
}

export interface ComponentScoreBreakdown {
  commitsScore: number;
  linesChangedScore: number;
  reviewsScore: number;
  recencyScore: number;
  mentorBoostApplied: boolean;
  mentorBoostAmount: number;
  totalScore: number;
  explanation: string;
}

export interface OwnershipSuggestion {
  username: string;
  role?: UserRole;
  finalScore: number; // Score normalized to 0 - 100 or relative percentage
  breakdown: ComponentScoreBreakdown;
  isTopOwner: boolean;
}

/**
 * Commit no formato usado pela analise de ownership por arquivo
 * (`ownership.ts`, `content.ts`).
 */
export interface Commit {
  hash: string;
  author: string;
  email?: string;
  date: string; // ISO date string
  filename: string;
  additions?: number;
  deletions?: number;
}

/**
 * Commit no formato usado pela analise de tendencias por modulo
 * (`analyzer.ts`, `trends.ts`).
 *
 * Era o mesmo `Commit` antes, mas as duas features foram desenvolvidas em
 * paralelo com formatos incompativeis (aqui o commit agrega modulo e janela de
 * tempo, la ele e por arquivo). Separar os tipos e o que permite as duas
 * coexistirem.
 */
export interface TrendCommit {
  author: string;
  module: string;
  timestamp: Date | string | number;
  commitsCount?: number;
  linesAdded?: number;
  linesDeleted?: number;
}

/** Commit no formato consumido pelo calculo de ownership de monorepo. */
export interface CommitInfo {
  hash: string;
  author: string;
  authorEmail?: string;
  date: string | Date;
  filesChanged: {
    path: string;
    additions?: number;
    deletions?: number;
  }[];
}

export interface PackageInfo {
  name: string;
  rootPath: string; // Relative path from repo root e.g. "packages/core"
}

export interface OwnershipScore {
  author: string;
  score: number;
  commitCount: number;
  linesChanged: number;
  lastCommitDate?: Date;
  whyExplanation: string;
}

export interface FileOwnershipResult {
  filePath: string;
  packageName?: string;
  packageRoot?: string;
  topOwner?: OwnershipScore;
  owners: OwnershipScore[];
  isMonorepoScoped: boolean;
}

export interface FileOwnershipSummary {
  filename: string;
  totalCommits: number;
  authorCommits: Record<string, number>;
  authorLastCommitDate: Record<string, string>;
  authorAdditions: Record<string, number>;
}

export interface ReviewerSuggestion {
  username: string;
  score: number;
  ownershipPercentage: number;
  recentCommitsCount: number;
  lastActiveDate: string | null;
  explanations: string[];
  fileBreakdown: {
    filename: string;
    commitsInFile: number;
    totalFileCommits: number;
    lastCommitDate: string;
  }[];
}

export interface AnalyzeOptions {
  prAuthor?: string;
  halfLifeDays?: number; // Days for recency exponential decay (default 90 days)
  maxSuggestions?: number;
}

export type OwnershipMetricType = 'commits' | 'linesChanged' | 'weighted';

export interface ContributionWindowMetric {
  author: string;
  module: string;
  commitsCount: number;
  linesAdded: number;
  linesDeleted: number;
  totalLinesChanged: number;
}

export type TrendDirection = 'increased' | 'decreased' | 'unchanged';

export interface TrendAnalysisOptions {
  windowDays?: number;
  metric?: OwnershipMetricType;
  asOfDate?: Date | string | number;
}

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

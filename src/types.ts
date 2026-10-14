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

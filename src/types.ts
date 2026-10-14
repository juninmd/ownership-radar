export interface Commit {
  hash: string;
  author: string;
  email?: string;
  date: string; // ISO date string
  filename: string;
  additions?: number;
  deletions?: number;
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

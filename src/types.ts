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

import { Commit } from './types.js';

export interface PRDetails {
  owner: string;
  repo: string;
  pullNumber: number;
  author: string;
}

export function parseGitHubPRUrl(url: string = window.location.href): PRDetails | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
    pullNumber: parseInt(match[3], 10),
    author: '', // To be filled from API or DOM
  };
}

export async function fetchPRFiles(owner: string, repo: string, pullNumber: number, token?: string): Promise<string[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) headers['Authorization'] = `token ${token}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`, { headers });
    if (!res.ok) return [];
    const files = await res.json();
    return files.map((f: { filename: string }) => f.filename);
  } catch {
    return [];
  }
}

export async function fetchFileCommits(owner: string, repo: string, filename: string, token?: string): Promise<Commit[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) headers['Authorization'] = `token ${token}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filename)}&per_page=100`, { headers });
    if (!res.ok) return [];
    const commitsData = await res.json();

    return commitsData.map((c: any) => ({
      hash: c.sha,
      author: c.author?.login || c.commit?.author?.name || 'Unknown',
      email: c.commit?.author?.email,
      date: c.commit?.author?.date || c.commit?.committer?.date || new Date().toISOString(),
      filename,
    }));
  } catch {
    return [];
  }
}

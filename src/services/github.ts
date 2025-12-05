import type { GitHubUser, GitHubRepo, GitHubCommit } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export class GitHubService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch<T>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await fetch(`${GITHUB_API_BASE}${url}`, {
        headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        ...headers,
        },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
    }

    async getUser(): Promise<GitHubUser> {
    return this.fetch<GitHubUser>('/user');
    }

    async getRepos(): Promise<GitHubRepo[]> {
    return this.fetch<GitHubRepo[]>('/user/repos?sort=updated&per_page=100');
    }

    async getRecentCommits(
        owner: string,
        repo: string,
        since?: string,
        branch?: string
        ): Promise<GitHubCommit[]> {

        const sinceParam = since ? `&since=${since}` : '';
        const branchParam = branch ? `&sha=${branch}` : '';
        return this.fetch<GitHubCommit[]>(
            `/repos/${owner}/${repo}/commits?per_page=30${sinceParam}${branchParam}`
        );
    }

    async getAllBranchesCommits(
        owner: string,
        repo: string,
        since?: string
        ): Promise<GitHubCommit[]> {
            
        try {
            const branches = await this.fetch<Array<{ name: string }>>(
            `/repos/${owner}/${repo}/branches`
            );

            const allCommits: GitHubCommit[] = [];

            for (const branch of branches) {
            try {
                const commits = await this.getRecentCommits(owner, repo, since, branch.name);
                allCommits.push(...commits);
            } catch (error) {
                console.warn(`Failed to fetch commits for branch ${branch.name}:`, error);
            }
            }

            const uniqueCommits = Array.from(
            new Map(allCommits.map(commit => [commit.sha, commit])).values()
            );

            return uniqueCommits.sort((a, b) =>
            new Date(b.commit.author.date).getTime() -
            new Date(a.commit.author.date).getTime()
            );
        } catch (error) {
            console.error('Failed to fetch all branches commits:', error);
            return this.getRecentCommits(owner, repo, since);
        }
    }

    /**
     * 커밋의 diff 가져오기 (새로 추가)
     */
    async getCommitDiff(owner: string, repo: string, sha: string): Promise<string> {
    try {
        // diff 형식으로 가져오기
        const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`,
        {
            headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/vnd.github.v3.diff',  // diff 형식 요청
            },
        }
        );

        if (!response.ok) {
        throw new Error(`Failed to fetch diff: ${response.statusText}`);
        }

        return await response.text();
    } catch (error) {
        console.error(`Failed to fetch diff for ${sha}:`, error);
        return '';
    }
    }
}

export async function validateGitHubToken(token: string): Promise<GitHubUser> {
    const service = new GitHubService(token);
    return service.getUser();
}
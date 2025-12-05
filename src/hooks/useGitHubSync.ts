import { useEffect, useRef, useState } from 'react';
import { useGitHubStore } from '../store/githubStore';
import { useTodoStore } from '../store/todoStore';
import { useProjectStore } from '../store/projectStore';
import { GitHubService } from '../services/github';
import { OpenAIService } from '../services/openai';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5분

export function useGitHubSync() {
const { connection, setRecentCommits, updateLastSync } = useGitHubStore();
const { todos, updateTodo } = useTodoStore();
const projects = useProjectStore((state) => state.projects);
const intervalRef = useRef<number | undefined>(undefined);
const [isSyncing, setIsSyncing] = useState(false);

const syncCommits = async () => {
    setIsSyncing(true);
    if (!connection.isConnected || !connection.accessToken) {
    return;
    }

    try {
    const service = new GitHubService(connection.accessToken);
    const ai = new OpenAIService();

    // 모든 프로젝트에 연결된 repo의 커밋 확인
    const reposToSync = new Set<{ owner: string; name: string; repoId: number }>();

    // 프로젝트에 연결된 repo들도 추가
    projects.forEach(project => {
        if (project.githubRepoId) {
        // repos에서 해당 ID 찾기
        const { repos } = useGitHubStore.getState();
        const repo = repos.find(r => r.id === project.githubRepoId);
        if (repo) {
            reposToSync.add({
            owner: repo.owner.login,
            name: repo.name,
            repoId: repo.id,
            });
        }
        }
    });

    if (reposToSync.size === 0) {
        console.log('No repos to sync');
        return;
    }

    let allCommits: any[] = [];

    // 각 repo의 커밋 가져오기
    for (const repo of reposToSync) {
        try {
        const commits = await service.getAllBranchesCommits(
            repo.owner,
            repo.name,
            connection.lastSync
        );

        // 각 커밋에 repo 정보 태깅
        const taggedCommits = commits.map(c => ({ ...c, _repoId: repo.repoId }));
        allCommits.push(...taggedCommits);
        } catch (error) {
        console.error(`Failed to sync ${repo.owner}/${repo.name}:`, error);
        }
    }

    if (allCommits.length === 0) {
        console.log('No new commits');
        updateLastSync();
        return;
    }

    console.log(`Found ${allCommits.length} new commits across all repositories`);
    setRecentCommits(allCommits);

    // 완료되지 않은 TODO만
    const pendingTodos = todos.filter(t => t.status !== 'completed');

    if (pendingTodos.length === 0) {
        console.log('No pending TODOs to match');
        updateLastSync();
        return;
    }

    // 각 커밋에 대해 AI 분석
    for (const commit of allCommits) {
        console.log(`Analyzing commit ${commit.sha.substring(0, 7)}...`);

        // 이 커밋의 repo와 연결된 프로젝트의 TODO만 필터링
        const projectsForThisRepo = projects.filter(p => p.githubRepoId === commit._repoId);
        const projectIds = projectsForThisRepo.map(p => p.id);

        // 해당 프로젝트의 TODO + 프로젝트 없는 TODO
        const relevantTodos = pendingTodos.filter(
        t => !t.projectId || projectIds.includes(t.projectId)
        );

        if (relevantTodos.length === 0) {
        console.log('No relevant TODOs for this repo');
        continue;
        }

        // 커밋 diff 가져오기
        const repoInfo = Array.from(reposToSync).find(r => r.repoId === commit._repoId);
        if (!repoInfo) continue;

        const diff = await service.getCommitDiff(repoInfo.owner, repoInfo.name, commit.sha);

        if (!diff) {
        console.log('No diff available, skipping');
        continue;
        }

        // AI에게 분석 요청
        const completedTodoIds = await ai.analyzeCommitForTodos(
        commit.commit.message,
        diff,
        relevantTodos.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
        }))
        );

        if (completedTodoIds.length === 0) {
        console.log('No TODOs matched by AI');
        continue;
        }

        // AI가 매칭한 TODO들 완료 처리
        for (const todoId of completedTodoIds) {
        const todo = relevantTodos.find(t => t.id === todoId);

        if (todo) {
            updateTodo(todo.id, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            completedByCommit: {
                sha: commit.sha,
                message: commit.commit.message,
                url: commit.html_url,
                date: commit.commit.author.date,
            },
            });

            console.log(`✅ AI-completed: "${todo.title}" (commit: ${commit.sha.substring(0, 7)})`);

            // 알림 표시
            if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('TODO Auto-Completed by AI! 🤖', {
                body: `"${todo.title}" was completed`,
                icon: '/vite.svg',
            });
            }
        }
        }
    }

    updateLastSync();
    } catch (error) {
    console.error('Sync error:', error);
    } finally {
    setIsSyncing(false);
    }
};

useEffect(() => {
    if (connection.isConnected) {
    syncCommits();
    intervalRef.current = window.setInterval(syncCommits, SYNC_INTERVAL);

    return () => {
        if (intervalRef.current) {
        clearInterval(intervalRef.current);
        }
    };
    }
}, [connection.isConnected, projects.length]);

return { syncCommits, isSyncing };
}
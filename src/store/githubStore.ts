import { create } from 'zustand';
import type { GitHubConnection, GitHubUser, GitHubRepo, GitHubCommit } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';
import { useAchievementStore } from './achievementStore';

interface GitHubStore {
  connection: GitHubConnection;
  repos: GitHubRepo[];
  recentCommits: GitHubCommit[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setAccessToken: (token: string) => void;
  setUser: (user: GitHubUser) => void;
  setRepos: (repos: GitHubRepo[]) => void;
  setRecentCommits: (commits: GitHubCommit[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  loadConnection: () => void;
  updateLastSync: () => void;
}

export const useGitHubStore = create<GitHubStore>((set, get) => ({
  connection: {
    isConnected: false,
  },
  repos: [],
  recentCommits: [],
  isLoading: false,
  error: null,

  setAccessToken: (token) => {
    const connection = { ...get().connection, accessToken: token, isConnected: true };
    set({ connection });
    setItem(STORAGE_KEYS.GITHUB_CONNECTION, connection);
  },

  setUser: (user) => {
    const connection = { ...get().connection, user };
    set({ connection });
    setItem(STORAGE_KEYS.GITHUB_CONNECTION, connection);

    // GitHub 연동 업적 체크
    useAchievementStore.getState().checkAndUnlock('special', 1, 'github_connect');
  },

  setRepos: (repos) => {
    set({ repos });
  },

  setRecentCommits: (commits) => {
    set({ recentCommits: commits });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  disconnect: () => {
    set({
      connection: { isConnected: false },
      repos: [],
      recentCommits: [],
      error: null,
    });
    setItem(STORAGE_KEYS.GITHUB_CONNECTION, { isConnected: false });
  },

  loadConnection: () => {
    const savedConnection = getItem<GitHubConnection>(
      STORAGE_KEYS.GITHUB_CONNECTION,
      { isConnected: false }
    );
    set({ connection: savedConnection });
  },

  updateLastSync: () => {
    const connection = {
      ...get().connection,
      lastSync: new Date().toISOString(),
    };
    set({ connection });
    setItem(STORAGE_KEYS.GITHUB_CONNECTION, connection);
  },
}));

import { create } from 'zustand';
import type { Achievement, AchievementProgress } from '../types';
import { getItem, setItem } from '../lib/storage';

// Predefined achievements list
export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: 'streak_3', name: 'Getting Started', description: '3-day streak', icon: '🌱', category: 'streak', requirement: 3 },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day streak', icon: '🔥', category: 'streak', requirement: 7 },
  { id: 'streak_14', name: 'Two Week Champion', description: '14-day streak', icon: '💪', category: 'streak', requirement: 14 },
  { id: 'streak_30', name: 'Monthly Miracle', description: '30-day streak', icon: '🏆', category: 'streak', requirement: 30 },
  { id: 'streak_100', name: 'Legend Begins', description: '100-day streak', icon: '👑', category: 'streak', requirement: 100 },

  // Completion achievements
  { id: 'complete_1', name: 'First Steps', description: 'Complete first task', icon: '👣', category: 'completion', requirement: 1 },
  { id: 'complete_10', name: 'On Fire', description: 'Complete 10 tasks', icon: '✨', category: 'completion', requirement: 10 },
  { id: 'complete_50', name: 'Productivity Master', description: 'Complete 50 tasks', icon: '⚡', category: 'completion', requirement: 50 },
  { id: 'complete_100', name: 'Centurion', description: 'Complete 100 tasks', icon: '🎯', category: 'completion', requirement: 100 },
  { id: 'complete_500', name: 'Legendary Achiever', description: 'Complete 500 tasks', icon: '🌟', category: 'completion', requirement: 500 },

  // Productivity achievements
  { id: 'daily_5', name: 'Daily Hero', description: 'Complete 5 in a day', icon: '🦸', category: 'productivity', requirement: 5 },
  { id: 'daily_10', name: 'Super Productive', description: 'Complete 10 in a day', icon: '🚀', category: 'productivity', requirement: 10 },

  // Special achievements
  { id: 'first_project', name: 'Project Started', description: 'Create first project', icon: '📁', category: 'special', requirement: 1 },
  { id: 'github_connect', name: 'Developer Path', description: 'Connect GitHub', icon: '🔗', category: 'special', requirement: 1 },
  { id: 'ai_breakdown', name: 'AI Collaboration', description: 'Use AI task breakdown', icon: '🤖', category: 'special', requirement: 1 },
  { id: 'recurring_setup', name: 'Habit Builder', description: 'Set up recurring task', icon: '🔁', category: 'special', requirement: 1 },
];

interface AchievementStore {
  progress: Record<string, AchievementProgress>;
  recentUnlock: Achievement | null; // 최근 해금된 업적 (알림용)
  loadProgress: () => void;
  checkAndUnlock: (type: 'streak' | 'completion' | 'daily' | 'special', value: number, specialId?: string) => void;
  getUnlockedAchievements: () => Achievement[];
  getLockedAchievements: () => Achievement[];
  getProgress: (achievementId: string) => AchievementProgress | undefined;
  clearRecentUnlock: () => void;
}

// Storage에 업적 키 추가
const ACHIEVEMENT_STORAGE_KEY = 'taskflow_achievements';

export const useAchievementStore = create<AchievementStore>((set, get) => ({
  progress: {},
  recentUnlock: null,

  loadProgress: () => {
    const saved = getItem<Record<string, AchievementProgress>>(ACHIEVEMENT_STORAGE_KEY, {});
    set({ progress: saved });
  },

  checkAndUnlock: (type, value, specialId) => {
    const { progress } = get();
    const newProgress = { ...progress };
    let newUnlock: Achievement | null = null;

    ACHIEVEMENTS.forEach((achievement) => {
      // 이미 해금된 업적은 스킵
      if (newProgress[achievement.id]?.isUnlocked) return;

      let shouldCheck = false;
      let currentValue = value;

      switch (type) {
        case 'streak':
          shouldCheck = achievement.category === 'streak';
          break;
        case 'completion':
          shouldCheck = achievement.id.startsWith('complete_');
          break;
        case 'daily':
          shouldCheck = achievement.id.startsWith('daily_');
          break;
        case 'special':
          shouldCheck = achievement.category === 'special' && achievement.id === specialId;
          currentValue = 1;
          break;
      }

      if (shouldCheck) {
        // 진행도 업데이트
        newProgress[achievement.id] = {
          achievementId: achievement.id,
          currentValue,
          isUnlocked: currentValue >= achievement.requirement,
          unlockedAt: currentValue >= achievement.requirement ? new Date().toISOString() : undefined,
        };

        // 새로 해금된 경우
        if (currentValue >= achievement.requirement && !progress[achievement.id]?.isUnlocked) {
          newUnlock = achievement;
        }
      }
    });

    set({ progress: newProgress, recentUnlock: newUnlock });
    setItem(ACHIEVEMENT_STORAGE_KEY, newProgress);
  },

  getUnlockedAchievements: () => {
    const { progress } = get();
    return ACHIEVEMENTS.filter((a) => progress[a.id]?.isUnlocked);
  },

  getLockedAchievements: () => {
    const { progress } = get();
    return ACHIEVEMENTS.filter((a) => !progress[a.id]?.isUnlocked);
  },

  getProgress: (achievementId) => {
    return get().progress[achievementId];
  },

  clearRecentUnlock: () => {
    set({ recentUnlock: null });
  },
}));

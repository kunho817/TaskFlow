import { create } from 'zustand';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { useAchievementStore } from './achievementStore';

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  todayCompleted: boolean;
  weeklyStats: { date: string; count: number }[];

  // Actions
  updateStreak: () => void;
  recordCompletion: () => void;
  loadStreak: () => void;
  saveStreak: () => void;
  getWeeklyStats: () => { date: string; count: number; dayName: string }[];
}

const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  todayCompleted: false,
  weeklyStats: [],

  updateStreak: () => {
    const { lastCompletedDate, currentStreak, longestStreak } = get();
    const today = getDateString();

    if (!lastCompletedDate) {
      return;
    }

    const daysDiff = getDaysDifference(lastCompletedDate, today);

    if (daysDiff === 0) {
      // Same day - no change needed
      set({ todayCompleted: true });
    } else if (daysDiff === 1) {
      // Consecutive day - streak continues
      const newStreak = currentStreak + 1;
      const newLongest = Math.max(newStreak, longestStreak);
      set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCompletedDate: today,
        todayCompleted: true,
      });
      get().saveStreak();
    } else {
      // Streak broken
      set({
        currentStreak: 1,
        lastCompletedDate: today,
        todayCompleted: true,
      });
      get().saveStreak();
    }
  },

  recordCompletion: () => {
    const { lastCompletedDate, currentStreak, longestStreak, weeklyStats } = get();
    const today = getDateString();

    // Update weekly stats
    const existingIndex = weeklyStats.findIndex((s) => s.date === today);
    let newWeeklyStats = [...weeklyStats];

    if (existingIndex >= 0) {
      newWeeklyStats[existingIndex] = {
        ...newWeeklyStats[existingIndex],
        count: newWeeklyStats[existingIndex].count + 1,
      };
    } else {
      newWeeklyStats.push({ date: today, count: 1 });
    }

    // Keep only last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    newWeeklyStats = newWeeklyStats.filter(
      (s) => new Date(s.date) >= sevenDaysAgo
    );

    // Update streak
    if (!lastCompletedDate || lastCompletedDate !== today) {
      const daysDiff = lastCompletedDate
        ? getDaysDifference(lastCompletedDate, today)
        : 999;

      let newStreak = currentStreak;
      if (daysDiff === 0) {
        // Already counted today
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak = currentStreak + 1;
      } else {
        // Streak broken, start new
        newStreak = 1;
      }

      const newLongest = Math.max(newStreak, longestStreak);

      set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCompletedDate: today,
        todayCompleted: true,
        weeklyStats: newWeeklyStats,
      });

      // 스트릭 업적 체크
      useAchievementStore.getState().checkAndUnlock('streak', newStreak);
    } else {
      set({ weeklyStats: newWeeklyStats });
    }

    get().saveStreak();
  },

  saveStreak: () => {
    const { currentStreak, longestStreak, lastCompletedDate, weeklyStats } = get();
    setItem(STORAGE_KEYS.STREAK, {
      currentStreak,
      longestStreak,
      lastCompletedDate,
      weeklyStats,
    });
  },

  loadStreak: () => {
    const saved = getItem<{
      currentStreak: number;
      longestStreak: number;
      lastCompletedDate: string | null;
      weeklyStats: { date: string; count: number }[];
    }>(STORAGE_KEYS.STREAK, {
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      weeklyStats: [],
    });

    const today = getDateString();
    const todayCompleted = saved.lastCompletedDate === today;

    // Check if streak should be reset
    if (saved.lastCompletedDate) {
      const daysDiff = getDaysDifference(saved.lastCompletedDate, today);
      if (daysDiff > 1) {
        // Streak broken
        set({
          currentStreak: 0,
          longestStreak: saved.longestStreak,
          lastCompletedDate: saved.lastCompletedDate,
          todayCompleted: false,
          weeklyStats: saved.weeklyStats || [],
        });
        return;
      }
    }

    set({
      ...saved,
      todayCompleted,
      weeklyStats: saved.weeklyStats || [],
    });
  },

  getWeeklyStats: () => {
    const { weeklyStats } = get();
    const result: { date: string; count: number; dayName: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = getDateString(date);
      const existing = weeklyStats.find((s) => s.date === dateStr);

      result.push({
        date: dateStr,
        count: existing?.count || 0,
        dayName: dayNames[date.getDay()],
      });
    }

    return result;
  },
}));

import { useEffect, useRef, useCallback } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { useStreakStore } from '@/store/streakStore';
import { useNotificationStore } from '@/store/notificationStore';
import {
  checkDueDateNotifications,
  showStreakReminder,
  showDailyReminder,
  showCompletionCelebration,
} from '@/lib/notifications';

export function useNotifications() {
  const todos = useTodoStore((state) => state.todos);
  const { currentStreak } = useStreakStore();
  const { settings, permission } = useNotificationStore();

  const lastCheckRef = useRef<number>(0);
  const dailyReminderTimeoutRef = useRef<number | null>(null);

  // Check due date notifications every 5 minutes
  useEffect(() => {
    if (!settings.enabled || !settings.dueDateReminders || permission !== 'granted') {
      return;
    }

    const checkInterval = 5 * 60 * 1000; // 5 minutes

    const check = () => {
      const now = Date.now();
      if (now - lastCheckRef.current >= checkInterval) {
        lastCheckRef.current = now;
        checkDueDateNotifications(todos, 30);
      }
    };

    // Initial check
    check();

    // Set up interval
    const intervalId = setInterval(check, checkInterval);

    return () => clearInterval(intervalId);
  }, [todos, settings.enabled, settings.dueDateReminders, permission]);

  // Schedule daily reminder
  useEffect(() => {
    if (!settings.enabled || !settings.dailyReminder || permission !== 'granted') {
      if (dailyReminderTimeoutRef.current) {
        clearTimeout(dailyReminderTimeoutRef.current);
        dailyReminderTimeoutRef.current = null;
      }
      return;
    }

    const scheduleDailyReminder = () => {
      const now = new Date();
      const [hours, minutes] = settings.dailyReminderTime.split(':').map(Number);

      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);

      // If target time has passed today, schedule for tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const delay = targetTime.getTime() - now.getTime();

      dailyReminderTimeoutRef.current = window.setTimeout(() => {
        const pendingTodos = todos.filter((t) => t.status !== 'completed');
        const highPriorityTodos = pendingTodos.filter((t) => t.priority === 'high');

        showDailyReminder(pendingTodos.length, highPriorityTodos.length);

        // Schedule next day's reminder
        scheduleDailyReminder();
      }, delay);
    };

    scheduleDailyReminder();

    return () => {
      if (dailyReminderTimeoutRef.current) {
        clearTimeout(dailyReminderTimeoutRef.current);
      }
    };
  }, [todos, settings.enabled, settings.dailyReminder, settings.dailyReminderTime, permission]);

  // Streak reminder - check at 8 PM if no tasks completed today
  useEffect(() => {
    if (!settings.enabled || !settings.streakReminder || permission !== 'granted') {
      return;
    }

    const checkStreakReminder = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Check if any task was completed today
      const completedToday = todos.some(
        (t) => t.status === 'completed' && t.completedAt?.startsWith(todayStr)
      );

      // If it's after 8 PM and no tasks completed today, send reminder
      if (now.getHours() >= 20 && !completedToday) {
        showStreakReminder(currentStreak);
      }
    };

    // Schedule for 8 PM
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(20, 0, 0, 0);

    if (targetTime <= now) {
      // Already past 8 PM, check immediately
      checkStreakReminder();
    } else {
      const delay = targetTime.getTime() - now.getTime();
      const timeoutId = setTimeout(checkStreakReminder, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [todos, currentStreak, settings.enabled, settings.streakReminder, permission]);

  // Show completion celebration
  const celebrateCompletion = useCallback(
    (taskTitle: string) => {
      if (settings.enabled && settings.completionCelebration && permission === 'granted') {
        showCompletionCelebration(taskTitle, currentStreak);
      }
    },
    [settings.enabled, settings.completionCelebration, permission, currentStreak]
  );

  return { celebrateCompletion };
}

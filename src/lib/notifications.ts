// Browser Notification Service

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission as NotificationPermission;
}

export function showNotification(options: NotificationOptions): Notification | null {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/vite.svg',
    tag: options.tag,
    requireInteraction: options.requireInteraction || false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
}

// Schedule a notification for a specific time
export function scheduleNotification(
  options: NotificationOptions,
  scheduledTime: Date
): number | null {
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();

  if (delay <= 0) {
    // Time has passed, don't schedule
    return null;
  }

  const timeoutId = window.setTimeout(() => {
    showNotification(options);
  }, delay);

  return timeoutId;
}

// Cancel a scheduled notification
export function cancelScheduledNotification(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}

// Check and notify for upcoming due dates
export function checkDueDateNotifications(
  todos: Array<{ id: string; title: string; dueDate?: string; status: string }>,
  notifyBeforeMinutes: number = 30
): void {
  const now = new Date();

  todos.forEach((todo) => {
    if (todo.status === 'completed' || !todo.dueDate) return;

    const dueDate = new Date(todo.dueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // Notify if due date is within the notification window
    if (minutesDiff > 0 && minutesDiff <= notifyBeforeMinutes) {
      showNotification({
        title: 'Task Due Soon',
        body: `"${todo.title}" is due in ${Math.round(minutesDiff)} minutes`,
        tag: `due-${todo.id}`,
      });
    }

    // Notify if overdue
    if (timeDiff < 0 && timeDiff > -1000 * 60 * 5) {
      // Within 5 minutes of becoming overdue
      showNotification({
        title: 'Task Overdue!',
        body: `"${todo.title}" is now overdue`,
        tag: `overdue-${todo.id}`,
      });
    }
  });
}

// Daily reminder notification
export function showDailyReminder(pendingCount: number, highPriorityCount: number): void {
  if (pendingCount === 0) {
    showNotification({
      title: 'All caught up!',
      body: 'You have no pending tasks. Great job!',
      tag: 'daily-reminder',
    });
  } else {
    showNotification({
      title: `You have ${pendingCount} pending tasks`,
      body: highPriorityCount > 0
        ? `${highPriorityCount} high priority task${highPriorityCount > 1 ? 's' : ''} need attention`
        : 'Stay focused and productive!',
      tag: 'daily-reminder',
    });
  }
}

// Streak reminder notification
export function showStreakReminder(currentStreak: number): void {
  if (currentStreak > 0) {
    showNotification({
      title: `Keep your ${currentStreak}-day streak going!`,
      body: "Don't forget to complete a task today to maintain your streak!",
      tag: 'streak-reminder',
    });
  } else {
    showNotification({
      title: 'Start a new streak today!',
      body: 'Complete a task to begin your productivity streak.',
      tag: 'streak-reminder',
    });
  }
}

// Task completion celebration
export function showCompletionCelebration(taskTitle: string, streak: number): void {
  showNotification({
    title: 'Task Completed!',
    body: streak > 1
      ? `"${taskTitle}" done! ${streak}-day streak going strong!`
      : `"${taskTitle}" completed! Great job!`,
    tag: 'completion',
  });
}

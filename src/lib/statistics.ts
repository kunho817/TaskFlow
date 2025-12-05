import type { Todo } from '@/types';

export interface DailyStats {
  date: string;
  completed: number;
  created: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM format
  year: number;
  monthName: string;
  totalCompleted: number;
  totalCreated: number;
  avgCompletedPerDay: number;
  highPriorityCompleted: number;
  mediumPriorityCompleted: number;
  lowPriorityCompleted: number;
  bestDay: DailyStats | null;
  completionRate: number;
}

export interface YearlyStats {
  year: number;
  totalCompleted: number;
  totalCreated: number;
  avgCompletedPerMonth: number;
  monthlyData: MonthlyStats[];
  bestMonth: MonthlyStats | null;
  completionRate: number;
}

// Helper function to get month name
function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month];
}

// Calculate daily statistics for a given date range
export function getDailyStats(todos: Todo[], startDate: Date, endDate: Date): DailyStats[] {
  const stats: Map<string, DailyStats> = new Map();

  // Initialize all dates in range
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  const endDateTime = new Date(endDate);
  endDateTime.setHours(23, 59, 59, 999);

  while (currentDate <= endDateTime) {
    const dateStr = currentDate.toISOString().split('T')[0];
    stats.set(dateStr, { date: dateStr, completed: 0, created: 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count todos
  todos.forEach((todo) => {
    const createdDate = todo.createdAt.split('T')[0];
    if (stats.has(createdDate)) {
      const stat = stats.get(createdDate)!;
      stat.created++;
    }

    if (todo.status === 'completed' && todo.completedAt) {
      const completedDate = todo.completedAt.split('T')[0];
      if (stats.has(completedDate)) {
        const stat = stats.get(completedDate)!;
        stat.completed++;
      }
    }
  });

  return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Calculate monthly statistics
export function getMonthlyStats(todos: Todo[], year: number, month: number): MonthlyStats {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Get todos for this month
  const monthTodos = todos.filter((todo) => {
    const createdMonth = todo.createdAt.substring(0, 7);
    const completedMonth = todo.completedAt?.substring(0, 7);
    return createdMonth === monthStr || completedMonth === monthStr;
  });

  // Count by priority
  const completedTodos = monthTodos.filter(
    (t) => t.status === 'completed' && t.completedAt?.startsWith(monthStr)
  );
  const createdTodos = monthTodos.filter((t) => t.createdAt.startsWith(monthStr));

  const highPriorityCompleted = completedTodos.filter((t) => t.priority === 'high').length;
  const mediumPriorityCompleted = completedTodos.filter((t) => t.priority === 'medium').length;
  const lowPriorityCompleted = completedTodos.filter((t) => t.priority === 'low').length;

  // Calculate days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get daily stats for this month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const dailyStats = getDailyStats(todos, startDate, endDate);

  // Find best day
  const bestDay = dailyStats.reduce<DailyStats | null>(
    (best, current) => (!best || current.completed > best.completed ? current : best),
    null
  );

  // Calculate completion rate
  const totalCreated = createdTodos.length;
  const totalCompleted = completedTodos.length;
  const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;

  return {
    month: monthStr,
    year,
    monthName: getMonthName(month),
    totalCompleted,
    totalCreated,
    avgCompletedPerDay: totalCompleted / daysInMonth,
    highPriorityCompleted,
    mediumPriorityCompleted,
    lowPriorityCompleted,
    bestDay: bestDay && bestDay.completed > 0 ? bestDay : null,
    completionRate,
  };
}

// Calculate yearly statistics
export function getYearlyStats(todos: Todo[], year: number): YearlyStats {
  const monthlyData: MonthlyStats[] = [];

  for (let month = 0; month < 12; month++) {
    monthlyData.push(getMonthlyStats(todos, year, month));
  }

  const totalCompleted = monthlyData.reduce((sum, m) => sum + m.totalCompleted, 0);
  const totalCreated = monthlyData.reduce((sum, m) => sum + m.totalCreated, 0);

  // Find best month
  const bestMonth = monthlyData.reduce<MonthlyStats | null>(
    (best, current) => (!best || current.totalCompleted > best.totalCompleted ? current : best),
    null
  );

  // Calculate completion rate
  const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0;

  return {
    year,
    totalCompleted,
    totalCreated,
    avgCompletedPerMonth: totalCompleted / 12,
    monthlyData,
    bestMonth: bestMonth && bestMonth.totalCompleted > 0 ? bestMonth : null,
    completionRate,
  };
}

// Get available years from todos
export function getAvailableYears(todos: Todo[]): number[] {
  const years = new Set<number>();

  todos.forEach((todo) => {
    years.add(new Date(todo.createdAt).getFullYear());
    if (todo.completedAt) {
      years.add(new Date(todo.completedAt).getFullYear());
    }
  });

  return Array.from(years).sort((a, b) => b - a);
}

// Get recent weeks data for trend chart
export function getWeeklyTrend(todos: Todo[], weeksBack: number = 4): DailyStats[] {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeksBack * 7));

  return getDailyStats(todos, startDate, endDate);
}

// Calculate productivity score (0-100)
export function calculateProductivityScore(
  completed: number,
  pending: number,
  streak: number,
  maxStreak: number
): number {
  const total = completed + pending;
  if (total === 0) return 0;

  // Base score from completion rate (0-60)
  const completionScore = (completed / total) * 60;

  // Streak bonus (0-40)
  const streakScore = maxStreak > 0 ? (streak / maxStreak) * 40 : 0;

  return Math.min(100, Math.round(completionScore + streakScore));
}

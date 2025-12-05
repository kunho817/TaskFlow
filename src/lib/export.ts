import type { Todo, Project, RoadmapItem } from '@/types';
import { format } from 'date-fns';

interface ExportData {
  todos: Todo[];
  projects: Project[];
  roadmapItems: RoadmapItem[];
  exportDate: string;
  version: string;
}

// JSON Export
export function exportToJSON(data: ExportData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadFile(blob, `taskflow-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
}

// CSV Export for TODOs
export function exportTodosToCSV(todos: Todo[], projects: Project[]): void {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Priority',
    'Status',
    'Project',
    'Due Date',
    'Estimated Time (min)',
    'Is Recurring',
    'Recurring Pattern',
    'GitHub Branch',
    'Created At',
    'Completed At',
  ];

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const rows = todos.map((todo) => [
    todo.id,
    escapeCsvValue(todo.title),
    escapeCsvValue(todo.description || ''),
    todo.priority,
    todo.status,
    todo.projectId ? projectMap.get(todo.projectId) || '' : '',
    todo.dueDate ? format(new Date(todo.dueDate), 'yyyy-MM-dd') : '',
    todo.estimatedTime?.toString() || '',
    todo.isRecurring ? 'Yes' : 'No',
    todo.recurringPattern || '',
    todo.githubBranch || '',
    format(new Date(todo.createdAt), 'yyyy-MM-dd HH:mm'),
    todo.completedAt ? format(new Date(todo.completedAt), 'yyyy-MM-dd HH:mm') : '',
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
  downloadFile(blob, `taskflow-todos-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

// CSV Export for Statistics
export function exportStatisticsToCSV(
  todos: Todo[],
  streak: { current: number; longest: number }
): void {
  const completedTodos = todos.filter((t) => t.status === 'completed');
  const pendingTodos = todos.filter((t) => t.status === 'pending');

  // Calculate stats by priority
  const byPriority = {
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
  };

  todos.forEach((todo) => {
    byPriority[todo.priority].total++;
    if (todo.status === 'completed') {
      byPriority[todo.priority].completed++;
    }
  });

  // Calculate daily completion for last 30 days
  const last30Days = new Map<string, number>();
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last30Days.set(format(date, 'yyyy-MM-dd'), 0);
  }

  completedTodos.forEach((todo) => {
    if (todo.completedAt) {
      const dateKey = format(new Date(todo.completedAt), 'yyyy-MM-dd');
      if (last30Days.has(dateKey)) {
        last30Days.set(dateKey, (last30Days.get(dateKey) || 0) + 1);
      }
    }
  });

  const statsContent = [
    '=== TaskFlow Statistics ===',
    '',
    '[Summary]',
    `Total TODOs,${todos.length}`,
    `Completed,${completedTodos.length}`,
    `Pending,${pendingTodos.length}`,
    `Completion Rate,${todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0}%`,
    '',
    '[Streak]',
    `Current Streak,${streak.current} days`,
    `Longest Streak,${streak.longest} days`,
    '',
    '[By Priority]',
    `High,${byPriority.high.completed}/${byPriority.high.total}`,
    `Medium,${byPriority.medium.completed}/${byPriority.medium.total}`,
    `Low,${byPriority.low.completed}/${byPriority.low.total}`,
    '',
    '[Daily Completion (Last 30 Days)]',
    'Date,Completed',
    ...Array.from(last30Days.entries())
      .sort()
      .map(([date, count]) => `${date},${count}`),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + statsContent], { type: 'text/csv;charset=utf-8' });
  downloadFile(blob, `taskflow-statistics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

// Import JSON backup
export async function importFromJSON(file: File): Promise<ExportData | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ExportData;

    // Basic validation
    if (!data.todos || !Array.isArray(data.todos)) {
      throw new Error('Invalid backup file: missing todos array');
    }
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Invalid backup file: missing projects array');
    }

    return data;
  } catch (error) {
    console.error('Failed to import backup:', error);
    return null;
  }
}

// Helper function to escape CSV values
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Helper function to trigger download
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// TODO Types
// ============================================

export type Priority = 'high' | 'medium' | 'low';
export type TodoStatus = 'pending' | 'in_progress' | 'completed';
export type RecurringPattern = 'daily' | 'weekly' | 'monthly';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  estimatedTime?: number; // 분 단위
  dueDate?: string; // ISO string
  assignee?: string;
  githubBranch?: string;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  generatedFromId?: string; // 반복 TODO에서 생성된 경우 원본 ID
  projectId?: string; // 프로젝트와 연결
  roadmapItemId?: string; // 로드맵 마일스톤과 연결
  completedByCommit?: {
    sha: string;
    message: string;
    url: string;
    date: string;
  }
}

// ============================================
// Project Types (새로 추가)
// ============================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;  // Tailwind color class (bg-blue-500, bg-green-500 등)
  githubRepoId?: number;  // 연결된 GitHub repo ID
  githubRepoName?: string;  // 표시용
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GitHub Types
// ============================================

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  email?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description?: string;
  html_url: string;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author?: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubConnection {
  isConnected: boolean;
  user?: GitHubUser;
  accessToken?: string;
  lastSync?: string; // ISO string
}

// ============================================
// AI Types
// ============================================

export type AIMessageType = 'encouragement' | 'suggestion' | 'breakdown' | 'time_estimate';

export interface AIMessage {
  id: string;
  type: AIMessageType;
  content: string;
  timestamp: string; // ISO string
  relatedTodoId?: string;
}

export interface AISuggestion {
  id: string;
  type: 'priority_recommendation' | 'task_breakdown' | 'time_estimate' | 'next_action';
  title: string;
  description: string;
  confidence: number; // 0-1
  relatedTodoId?: string;
  actionable: boolean;
  action?: () => void;
}

export interface TaskBreakdown {
  originalTask: string;
  subtasks: Array<{
    title: string;
    description?: string;
    estimatedTime: number;
    order: number;
  }>;
}

// ============================================
// Roadmap Types
// ============================================

export type RoadmapItemType = 'feature' | 'milestone' | 'bugfix' | 'research';

export interface RoadmapItem {
  id: string;
  title: string;
  description?: string;
  type: RoadmapItemType;
  priority: Priority;
  startDate: string; // ISO string
  endDate: string; // ISO string
  assignee?: string;
  githubBranch?: string;
  status: TodoStatus;
  todos: string[]; // Todo IDs
}

// ============================================
// Dashboard & Stats Types
// ============================================

export interface DailyStats {
  date: string; // YYYY-MM-DD
  completedCount: number;
  totalCount: number;
  totalTimeSpent: number; // 분 단위
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate?: string; // YYYY-MM-DD
}

export interface WeeklyActivity {
  weekStart: string; // YYYY-MM-DD
  dailyStats: DailyStats[];
  totalCompleted: number;
  totalCreated: number;
}

// ============================================
// Achievement Types
// ============================================

export type AchievementCategory = 'streak' | 'completion' | 'productivity' | 'special';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  category: AchievementCategory;
  requirement: number; // 달성 조건 수치
  unlockedAt?: string; // ISO string, 해금된 시간
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

// ============================================
// User & Settings Types
// ============================================

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    morningReminder: boolean;
    morningReminderTime: string; // HH:mm
    streakAlert: boolean;
    deadlineAlerts: boolean;
  };
  ai: {
    enabled: boolean;
    autoSuggest: boolean;
    autoBreakdown: boolean;
  };
  github: GitHubConnection;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  settings: UserSettings;
  createdAt: string; // ISO string
}

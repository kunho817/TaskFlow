/**
 * LocalStorage 유틸리티
 * 타입 안전한 로컬 스토리지 관리
 */

const STORAGE_KEYS = {
  TODOS: 'taskflow_todos',
  PROJECTS: 'taskflow_projects',
  GITHUB_CONNECTION: 'taskflow_github',
  USER_SETTINGS: 'taskflow_settings',
  STREAK: 'taskflow_streak',
  STREAK_DATA: 'taskflow_streak',
  DAILY_STATS: 'taskflow_daily_stats',
  AI_MESSAGES: 'taskflow_ai_messages',
  ROADMAP_ITEMS: 'taskflow_roadmap',
} as const;

/**
 * 로컬 스토리지에 데이터 저장
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

/**
 * 로컬 스토리지에서 데이터 가져오기
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * 로컬 스토리지에서 데이터 삭제
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

/**
 * 모든 TaskFlow 데이터 삭제
 */
export function clearAll(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * 스토리지 키 export
 */
export { STORAGE_KEYS };

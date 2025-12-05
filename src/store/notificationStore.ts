import { create } from 'zustand';
import { getItem, setItem } from '../lib/storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermission,
} from '../lib/notifications';

interface NotificationSettings {
  enabled: boolean;
  dueDateReminders: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  streakReminder: boolean;
  completionCelebration: boolean;
}

interface NotificationStore {
  permission: NotificationPermission;
  settings: NotificationSettings;

  // Actions
  checkPermission: () => void;
  requestPermission: () => Promise<boolean>;
  updateSettings: (updates: Partial<NotificationSettings>) => void;
  loadSettings: () => void;
}

const STORAGE_KEY = 'taskflow_notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: false,
  dueDateReminders: true,
  dailyReminder: false,
  dailyReminderTime: '09:00',
  streakReminder: true,
  completionCelebration: true,
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  permission: 'default',
  settings: defaultSettings,

  checkPermission: () => {
    const permission = getNotificationPermission();
    set({ permission });

    // If permission was revoked, disable notifications
    if (permission === 'denied' && get().settings.enabled) {
      get().updateSettings({ enabled: false });
    }
  },

  requestPermission: async () => {
    const permission = await requestNotificationPermission();
    set({ permission });

    if (permission === 'granted') {
      get().updateSettings({ enabled: true });
      return true;
    }

    return false;
  },

  updateSettings: (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    setItem(STORAGE_KEY, newSettings);
  },

  loadSettings: () => {
    const savedSettings = getItem<NotificationSettings>(STORAGE_KEY, defaultSettings);
    const permission = getNotificationPermission();

    // Ensure enabled is false if permission is not granted
    if (permission !== 'granted' && savedSettings.enabled) {
      savedSettings.enabled = false;
    }

    set({ settings: savedSettings, permission });
  },
}));

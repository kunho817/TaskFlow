import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import AchievementUnlockToast from '@/components/achievement/AchievementUnlockToast';
import { Toaster } from '@/components/ui/sonner';
import { useAchievementStore } from '@/store/achievementStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';

export default function AppLayout() {
  const loadProgress = useAchievementStore((state) => state.loadProgress);
  const { loadSettings, checkPermission } = useNotificationStore();

  // Initialize notification system
  useNotifications();

  useEffect(() => {
    loadProgress();
    loadSettings();
    checkPermission();
  }, [loadProgress, loadSettings, checkPermission]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Achievement Unlock Toast */}
      <AchievementUnlockToast />

      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useAchievementStore } from '@/store/achievementStore';
import { cn } from '@/lib/utils';

export default function AchievementUnlockToast() {
  const { recentUnlock, clearRecentUnlock } = useAchievementStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (recentUnlock) {
      setIsVisible(true);
      setIsLeaving(false);

      // 3초 후 사라지기 시작
      const hideTimer = setTimeout(() => {
        setIsLeaving(true);
      }, 3000);

      // 3.5초 후 완전히 제거
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        clearRecentUnlock();
      }, 3500);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [recentUnlock, clearRecentUnlock]);

  if (!isVisible || !recentUnlock) return null;

  return (
    <div
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500',
        isLeaving ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
      )}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-yellow-500/30 flex items-center gap-4 animate-bounce-once">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          {recentUnlock.icon}
        </div>

        {/* Content */}
        <div>
          <p className="text-xs uppercase tracking-wider opacity-80">Achievement Unlocked!</p>
          <p className="font-bold text-lg">{recentUnlock.name}</p>
          <p className="text-sm opacity-90">{recentUnlock.description}</p>
        </div>
      </div>
    </div>
  );
}

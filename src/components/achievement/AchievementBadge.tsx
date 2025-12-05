import { cn } from '@/lib/utils';
import { useAchievementStore } from '@/store/achievementStore';
import type { Achievement } from '@/types';

interface AchievementBadgeProps {
  achievement: Achievement;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function AchievementBadge({
  achievement,
  showProgress = false,
  size = 'md',
}: AchievementBadgeProps) {
  const progress = useAchievementStore((state) => state.getProgress(achievement.id));
  const isUnlocked = progress?.isUnlocked ?? false;
  const currentValue = progress?.currentValue ?? 0;

  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const progressPercentage = Math.min((currentValue / achievement.requirement) * 100, 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center transition-all',
          sizeClasses[size],
          isUnlocked
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/30'
            : 'bg-muted grayscale'
        )}
      >
        <span className={cn(!isUnlocked && 'opacity-50')}>{achievement.icon}</span>

        {/* Progress ring for locked achievements */}
        {!isUnlocked && showProgress && progressPercentage > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted-foreground/20"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${progressPercentage * 2.89} 289`}
              className="text-primary transition-all"
            />
          </svg>
        )}
      </div>

      <div className="text-center">
        <p className={cn(
          'font-medium',
          size === 'sm' ? 'text-xs' : 'text-sm',
          !isUnlocked && 'text-muted-foreground'
        )}>
          {achievement.name}
        </p>
        {showProgress && (
          <p className="text-xs text-muted-foreground">
            {isUnlocked ? 'Unlocked!' : `${currentValue}/${achievement.requirement}`}
          </p>
        )}
      </div>
    </div>
  );
}

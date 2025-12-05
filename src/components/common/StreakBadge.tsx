import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function StreakBadge({
  count,
  size = 'md',
  showLabel = false,
  className,
}: StreakBadgeProps) {
  const isActive = count > 0;

  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-lg gap-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-bold',
        sizeClasses[size],
        isActive ? 'text-orange-500' : 'text-muted-foreground',
        className
      )}
    >
      <Flame
        className={cn(
          iconSizes[size],
          isActive && 'animate-pulse'
        )}
        fill={isActive ? 'currentColor' : 'none'}
      />
      <span>{count}</span>
      {showLabel && (
        <span className="font-normal text-muted-foreground">
          {count === 1 ? 'day' : 'days'}
        </span>
      )}
    </div>
  );
}

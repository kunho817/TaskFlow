import { useEffect } from 'react';
import { useStreakStore } from '@/store/streakStore';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StreakCard() {
  const { currentStreak, longestStreak, todayCompleted, loadStreak } = useStreakStore();

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const isActive = currentStreak > 0;

  return (
    <Card className={cn(
      'overflow-hidden transition-all duration-300 hover:shadow-lg',
      isActive && 'ring-2 ring-orange-500/20'
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Main Streak Display */}
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center',
              isActive
                ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                : 'bg-muted text-muted-foreground'
            )}>
              <Flame
                className={cn('w-8 h-8', isActive && 'animate-pulse')}
                fill={isActive ? 'currentColor' : 'none'}
              />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{currentStreak}</span>
                <span className="text-muted-foreground">
                  {currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Current streak' : 'Start your streak!'}
              </p>
            </div>
          </div>

          {/* Best Streak */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">Best</span>
            </div>
            <p className="text-2xl font-semibold">{longestStreak}</p>
          </div>
        </div>

        {/* Today Status */}
        <div className={cn(
          'mt-4 p-3 rounded-lg text-sm text-center',
          todayCompleted
            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        )}>
          {todayCompleted
            ? "You've completed a task today! Keep it up!"
            : 'Complete a task to maintain your streak!'}
        </div>
      </CardContent>
    </Card>
  );
}

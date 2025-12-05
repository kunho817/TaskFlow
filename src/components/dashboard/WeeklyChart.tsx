import { useEffect } from 'react';
import { useStreakStore } from '@/store/streakStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WeeklyChart() {
  const { loadStreak, getWeeklyStats } = useStreakStore();

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  const weeklyStats = getWeeklyStats();
  const maxCount = Math.max(...weeklyStats.map((s) => s.count), 1);
  const today = new Date().toISOString().split('T')[0];

  const totalThisWeek = weeklyStats.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            This Week
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalThisWeek} {totalThisWeek === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyStats.map((stat) => {
            const height = stat.count > 0 ? (stat.count / maxCount) * 100 : 8;
            const isToday = stat.date === today;

            return (
              <div key={stat.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  {stat.count > 0 && (
                    <span className="text-xs font-medium mb-1">{stat.count}</span>
                  )}
                  <div
                    className={cn(
                      'w-full rounded-t transition-all duration-300',
                      isToday
                        ? 'bg-primary'
                        : stat.count > 0
                        ? 'bg-primary/60'
                        : 'bg-muted'
                    )}
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  />
                </div>
                <span
                  className={cn(
                    'text-xs',
                    isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                  )}
                >
                  {stat.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTodoStore } from '@/store/todoStore';
import { useGitHubStore } from '@/store/githubStore';
import { useProjectStore } from '@/store/projectStore';
import { useStreakStore } from '@/store/streakStore';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { useRecurringTodos } from '@/hooks/useRecurringTodos';
import StreakCard from '@/components/dashboard/StreakCard';
import TodayGoals from '@/components/dashboard/TodayGoals';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import AIEncouragement from '@/components/dashboard/AIEncouragement';
import TaskBreakdownModal from '@/components/ai/TaskBreakdownModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Sparkles, Github } from 'lucide-react';

export default function Dashboard() {
  const { loadTodos } = useTodoStore();
  const { loadConnection, connection } = useGitHubStore();
  const { loadProjects } = useProjectStore();
  const { loadStreak } = useStreakStore();
  useGitHubSync();
  useRecurringTodos(); // 반복 TODO 자동 생성

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  useEffect(() => {
    loadTodos();
    loadConnection();
    loadProjects();
    loadStreak();
  }, [loadTodos, loadConnection, loadProjects, loadStreak]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}!</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBreakdownModal(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Breakdown
          </Button>
          <Button asChild>
            <Link to="/projects">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* GitHub Status */}
      {!connection.isConnected && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <Link to="/profile" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Github className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Connect GitHub</p>
                <p className="text-xs text-muted-foreground">
                  Auto-complete tasks from commits
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Desktop Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Streak Card */}
          <StreakCard />

          {/* AI Encouragement */}
          <AIEncouragement />

          {/* Weekly Chart */}
          <WeeklyChart />
        </div>

        {/* Right Column - Today's Goals (taller on desktop) */}
        <div className="md:row-span-2">
          <TodayGoals />
        </div>
      </div>

      {/* Mobile Quick Actions (FAB) */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 md:hidden">
        <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setShowBreakdownModal(true)}
        >
          <Sparkles className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          asChild
        >
          <Link to="/projects">
            <Plus className="w-6 h-6" />
          </Link>
        </Button>
      </div>

      {/* Modals */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
      />
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Target,
  Flame,
  Award,
  BarChart3,
} from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import { useStreakStore } from '@/store/streakStore';
import {
  getMonthlyStats,
  getYearlyStats,
  getAvailableYears,
  calculateProductivityScore,
  type MonthlyStats,
  type YearlyStats,
} from '@/lib/statistics';

type ViewType = 'monthly' | 'yearly';

export default function StatisticsReport() {
  const todos = useTodoStore((state) => state.todos);
  const { currentStreak, longestStreak } = useStreakStore();

  const currentDate = new Date();
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const availableYears = useMemo(() => {
    const years = getAvailableYears(todos);
    if (years.length === 0) {
      return [currentDate.getFullYear()];
    }
    return years;
  }, [todos]);

  const monthlyStats = useMemo(
    () => getMonthlyStats(todos, selectedYear, selectedMonth),
    [todos, selectedYear, selectedMonth]
  );

  const yearlyStats = useMemo(
    () => getYearlyStats(todos, selectedYear),
    [todos, selectedYear]
  );

  // Calculate overall stats
  const completedTodos = todos.filter((t) => t.status === 'completed').length;
  const pendingTodos = todos.filter((t) => t.status !== 'completed').length;
  const productivityScore = calculateProductivityScore(
    completedTodos,
    pendingTodos,
    currentStreak,
    longestStreak
  );

  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get max value for chart scaling
  const maxMonthlyCompleted = Math.max(
    ...yearlyStats.monthlyData.map((m) => m.totalCompleted),
    1
  );

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex items-center justify-between">
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
          <TabsList>
            <TabsTrigger value="monthly" className="gap-1">
              <Calendar className="w-4 h-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              Yearly
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Year Selector */}
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Productivity Score Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Productivity Score
              </h3>
              <p className="text-sm text-muted-foreground">
                Based on completion rate and streak
              </p>
            </div>
            <div className="text-4xl font-bold text-primary">{productivityScore}</div>
          </div>
          <Progress value={productivityScore} className="h-3" />
        </CardContent>
      </Card>

      {viewType === 'monthly' ? (
        <MonthlyView
          stats={monthlyStats}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onNavigate={navigateMonth}
          monthNames={monthNames}
        />
      ) : (
        <YearlyView
          stats={yearlyStats}
          maxCompleted={maxMonthlyCompleted}
          monthNames={monthNames}
        />
      )}
    </div>
  );
}

// Monthly View Component
function MonthlyView({
  stats,
  selectedMonth,
  selectedYear,
  onNavigate,
  monthNames,
}: {
  stats: MonthlyStats;
  selectedMonth: number;
  selectedYear: number;
  onNavigate: (direction: number) => void;
  monthNames: string[];
}) {
  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => onNavigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {monthNames[selectedMonth]} {selectedYear}
        </h2>
        <Button variant="outline" size="icon" onClick={() => onNavigate(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{stats.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{stats.avgCompletedPerDay.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Completed by Priority</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">High</Badge>
              <span className="text-sm">{stats.highPriorityCompleted} tasks</span>
            </div>
            <div className="w-24">
              <Progress
                value={
                  stats.totalCompleted > 0
                    ? (stats.highPriorityCompleted / stats.totalCompleted) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-500">Medium</Badge>
              <span className="text-sm">{stats.mediumPriorityCompleted} tasks</span>
            </div>
            <div className="w-24">
              <Progress
                value={
                  stats.totalCompleted > 0
                    ? (stats.mediumPriorityCompleted / stats.totalCompleted) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Low</Badge>
              <span className="text-sm">{stats.lowPriorityCompleted} tasks</span>
            </div>
            <div className="w-24">
              <Progress
                value={
                  stats.totalCompleted > 0
                    ? (stats.lowPriorityCompleted / stats.totalCompleted) * 100
                    : 0
                }
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Day */}
      {stats.bestDay && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-medium">Best Day</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(stats.bestDay.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  - {stats.bestDay.completed} tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Rate */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monthly Completion Rate</span>
            <span className="text-sm font-bold">{stats.completionRate.toFixed(0)}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalCompleted} completed of {stats.totalCreated} created
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Yearly View Component
function YearlyView({
  stats,
  maxCompleted,
  monthNames,
}: {
  stats: YearlyStats;
  maxCompleted: number;
  monthNames: string[];
}) {
  return (
    <div className="space-y-4">
      {/* Year Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Total Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.avgCompletedPerMonth.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg/Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">
              {stats.bestMonth?.monthName.substring(0, 3) || '-'}
            </p>
            <p className="text-xs text-muted-foreground">Best Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-1">
            {stats.monthlyData.map((month, index) => {
              const height = maxCompleted > 0 ? (month.totalCompleted / maxCompleted) * 100 : 0;
              const isCurrentMonth =
                new Date().getFullYear() === stats.year &&
                new Date().getMonth() === index;

              return (
                <div
                  key={month.month}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isCurrentMonth ? 'bg-primary' : 'bg-primary/60'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${month.monthName}: ${month.totalCompleted} completed`}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {monthNames[index].substring(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.monthlyData
              .filter((m) => m.totalCompleted > 0 || m.totalCreated > 0)
              .sort((a, b) => b.month.localeCompare(a.month))
              .map((month) => (
                <div
                  key={month.month}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <span className="text-sm font-medium">{month.monthName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {month.totalCreated} created
                    </span>
                    <Badge variant="secondary">{month.totalCompleted} done</Badge>
                  </div>
                </div>
              ))}
            {stats.monthlyData.every((m) => m.totalCompleted === 0 && m.totalCreated === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data for this year
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

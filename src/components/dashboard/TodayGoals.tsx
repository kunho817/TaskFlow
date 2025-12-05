import { useTodoStore } from '@/store/todoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Target, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const priorityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

export default function TodayGoals() {
  const { todos, toggleTodoStatus } = useTodoStore();

  // Get pending todos, sorted by priority
  const pendingTodos = todos
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  const completedToday = todos.filter((t) => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.completedAt.startsWith(today);
  }).length;

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Today's Goals
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {completedToday} done today
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendingTodos.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <p className="text-sm">All caught up!</p>
            <Link
              to="/projects"
              className="text-sm text-primary hover:underline mt-1 inline-flex items-center gap-1"
            >
              Add new tasks <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <>
            {pendingTodos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg bg-muted/50 border-l-4',
                  priorityColors[todo.priority]
                )}
              >
                <Checkbox
                  checked={todo.status === 'completed'}
                  onCheckedChange={() => toggleTodoStatus(todo.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="flex-1 text-sm truncate">{todo.title}</span>
                {todo.estimatedTime && (
                  <span className="text-xs text-muted-foreground">
                    {todo.estimatedTime}m
                  </span>
                )}
              </div>
            ))}
            <Link
              to="/projects"
              className="block text-center text-sm text-muted-foreground hover:text-foreground py-2"
            >
              View all tasks <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { toast } from 'sonner';
import type { Todo } from '@/types';
import { useTodoStore } from '@/store/todoStore';
import { useProjectStore } from '@/store/projectStore';
import { useStreakStore } from '@/store/streakStore';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import PriorityBadge from '@/components/common/PriorityBadge';
import { Trash2, Clock, GitCommit, ExternalLink, CalendarDays, AlertTriangle, Repeat, Pencil } from 'lucide-react';
import TodoEditModal from './TodoEditModal';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isToday, isTomorrow, isPast } from 'date-fns';

// Format estimated time
function formatEstimatedTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Recurring pattern label
function getRecurringLabel(pattern: string): string {
  switch (pattern) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    default: return pattern;
  }
}

// Due date info calculation
function getDueDateInfo(dueDate: string): { label: string; isUrgent: boolean; isOverdue: boolean } {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isPast(date) && !isToday(date)) {
    const days = differenceInDays(today, date);
    return { label: `${days}d overdue`, isUrgent: true, isOverdue: true };
  }
  if (isToday(date)) {
    return { label: 'Today', isUrgent: true, isOverdue: false };
  }
  if (isTomorrow(date)) {
    return { label: 'Tomorrow', isUrgent: true, isOverdue: false };
  }
  const days = differenceInDays(date, today);
  if (days <= 3) {
    return { label: `D-${days}`, isUrgent: true, isOverdue: false };
  }
  return { label: format(date, 'MM/dd (EEE)'), isUrgent: false, isOverdue: false };
}

interface TodoItemProps {
  todo: Todo;
}

const priorityColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-500',
};

export default function TodoItem({ todo }: TodoItemProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toggleTodoStatus, deleteTodo, updateTodo } = useTodoStore();
  const { recordCompletion } = useStreakStore();
  const projects = useProjectStore((state) => state.projects);

  const isCompleted = todo.status === 'completed';
  const project = todo.projectId
    ? projects.find((p) => p.id === todo.projectId)
    : null;

  const handleToggle = () => {
    const wasCompleted = todo.status === 'completed';

    // 완료 애니메이션 트리거
    if (!wasCompleted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }

    toggleTodoStatus(todo.id);

    // Record completion for streak if newly completed
    if (!wasCompleted) {
      updateTodo(todo.id, { completedAt: new Date().toISOString() });
      recordCompletion();
      toast.success('Task completed!', {
        description: todo.title.length > 40 ? todo.title.substring(0, 40) + '...' : todo.title,
      });
    }
  };

  return (
    <Card
      className={cn(
        'border-l-4 transition-all duration-300 hover:shadow-md hover:border-l-[6px]',
        priorityColors[todo.priority],
        isCompleted && 'opacity-60',
        isAnimating && 'animate-complete scale-[1.02] bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggle}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <h3
              className={cn(
                'font-medium',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {todo.title}
            </h3>

            {/* Description */}
            {todo.description && (
              <p className="text-sm text-muted-foreground">{todo.description}</p>
            )}

            {/* Commit Info */}
            {todo.completedByCommit && (
              <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium mb-1">
                  <GitCommit className="w-3 h-3" />
                  Auto-completed by commit
                </div>
                <a
                  href={todo.completedByCommit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <code className="font-mono">
                    {todo.completedByCommit.sha.substring(0, 7)}
                  </code>
                  <span className="truncate flex-1">
                    {todo.completedByCommit.message.split('\n')[0]}
                  </span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <PriorityBadge priority={todo.priority} size="sm" />

              {todo.isRecurring && todo.recurringPattern && (
                <Badge variant="secondary" className="gap-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <Repeat className="w-3 h-3" />
                  {getRecurringLabel(todo.recurringPattern)}
                </Badge>
              )}

              {todo.dueDate && !isCompleted && (() => {
                const { label, isUrgent, isOverdue } = getDueDateInfo(todo.dueDate);
                return (
                  <Badge
                    variant={isOverdue ? 'destructive' : isUrgent ? 'secondary' : 'outline'}
                    className={cn(
                      'gap-1 text-xs',
                      isOverdue && 'bg-red-500 text-white',
                      isUrgent && !isOverdue && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                    )}
                  >
                    {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                    {label}
                  </Badge>
                );
              })()}

              {todo.estimatedTime && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  {formatEstimatedTime(todo.estimatedTime)}
                </Badge>
              )}

              {project && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs"
                  style={{
                    borderColor: project.color.replace('bg-', ''),
                  }}
                >
                  <div className={`w-2 h-2 rounded-full ${project.color}`} />
                  {project.name}
                </Badge>
              )}

              {todo.githubBranch && (
                <Badge variant="outline" className="gap-1 text-xs font-mono">
                  <GitCommit className="w-3 h-3" />
                  {todo.githubBranch}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditOpen(true)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{todo.title.length > 50 ? todo.title.substring(0, 50) + '...' : todo.title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteTodo(todo.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>

      {/* Edit Modal */}
      <TodoEditModal
        todo={todo}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </Card>
  );
}

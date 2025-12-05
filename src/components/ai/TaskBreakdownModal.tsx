import { useState } from 'react';
import { toast } from 'sonner';
import { useTodoStore } from '@/store/todoStore';
import { useAchievementStore } from '@/store/achievementStore';
import { OpenAIService } from '@/services/openai';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Priority } from '@/types';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskBreakdownModal({ isOpen, onClose }: TaskBreakdownModalProps) {
  const [bigTask, setBigTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<Array<{ title: string; estimatedTime: number }>>([]);
  const addTodo = useTodoStore((state) => state.addTodo);

  const handleBreakdown = async () => {
    if (!bigTask.trim()) return;

    setIsLoading(true);
    try {
      const ai = new OpenAIService();
      const breakdown = await ai.breakdownTask(bigTask);
      setSubtasks(breakdown);
    } catch (error) {
      console.error('Failed to breakdown task:', error);
      toast.warning('AI unavailable', {
        description: 'Using default task template instead.',
      });
      // Fallback breakdown
      setSubtasks([
        { title: `Plan: ${bigTask}`, estimatedTime: 30 },
        { title: `Research: ${bigTask}`, estimatedTime: 60 },
        { title: `Execute: ${bigTask}`, estimatedTime: 120 },
        { title: `Review: ${bigTask}`, estimatedTime: 30 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTodos = () => {
    subtasks.forEach((subtask) => {
      addTodo({
        title: subtask.title,
        priority: 'medium' as Priority,
        estimatedTime: subtask.estimatedTime,
      });
    });

    // AI 작업 분해 업적 체크
    useAchievementStore.getState().checkAndUnlock('special', 1, 'ai_breakdown');

    toast.success(`${subtasks.length} tasks created`, {
      description: `Total estimated time: ${totalTime} min`,
    });

    setBigTask('');
    setSubtasks([]);
    onClose();
  };

  const handleReset = () => {
    setSubtasks([]);
    setBigTask('');
  };

  const totalTime = subtasks.reduce((sum, t) => sum + t.estimatedTime, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Task Breakdown
          </DialogTitle>
          <DialogDescription>
            Enter a large goal and let AI break it down into smaller tasks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input */}
          <div className="space-y-2">
            <Input
              value={bigTask}
              onChange={(e) => setBigTask(e.target.value)}
              placeholder="e.g., Build a portfolio website"
              disabled={isLoading || subtasks.length > 0}
            />
          </div>

          {/* Breakdown Button or Results */}
          {subtasks.length === 0 ? (
            <Button
              onClick={handleBreakdown}
              disabled={isLoading || !bigTask.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Breaking down...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Break Down with AI
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {subtasks.length} tasks generated
                </span>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {totalTime} min total
                </Badge>
              </div>

              {/* Subtask List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {subtasks.map((subtask, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}.
                          </span>
                          <span className="text-sm">{subtask.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {subtask.estimatedTime}m
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleCreateTodos} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Tasks
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

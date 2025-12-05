import { useEffect, useState } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { useStreakStore } from '@/store/streakStore';
import { OpenAIService } from '@/services/openai';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AIEncouragement() {
  const todos = useTodoStore((state) => state.todos);
  const { currentStreak } = useStreakStore();
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const completedCount = todos.filter((t) => t.status === 'completed').length;

  const generateMessage = async () => {
    const today = new Date().toDateString();
    const completedToday = todos.filter(
      (t) =>
        t.status === 'completed' &&
        t.completedAt &&
        new Date(t.completedAt).toDateString() === today
    ).length;

    if (completedToday === 0 && todos.filter((t) => t.status !== 'completed').length === 0) {
      setMessage('Add your first task to get started!');
      return;
    }

    if (completedToday === 0) {
      setMessage("Ready to start your day? Let's tackle your tasks!");
      return;
    }

    try {
      setIsLoading(true);
      const ai = new OpenAIService();
      const encouragement = await ai.generateEncouragement(completedToday, currentStreak);
      setMessage(encouragement);
    } catch (error) {
      console.error('Failed to generate encouragement:', error);
      // Fallback messages
      const fallbacks = [
        `Amazing! ${completedToday} tasks done today!`,
        `You're on fire! Keep going!`,
        `Great progress! ${completedToday} tasks completed!`,
        `Fantastic work! You've got this!`,
      ];
      setMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateMessage();
  }, [completedCount, currentStreak]);

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              AI Assistant
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            ) : (
              <p className={cn('text-sm', message && 'animate-in fade-in-0 duration-500')}>
                {message || "Let's make today productive!"}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={generateMessage}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

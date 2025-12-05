import { useEffect, useState } from 'react';
import { useTodoStore } from '../../store/todoStore';
import { OpenAIService } from '../../services/openai';

export default function EncouragementCard() {
    const todos = useTodoStore((state) => state.todos);
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const generateMessage = async () => {
    const today = new Date().toDateString();
    const completedToday = todos.filter(
        (t) => t.status === 'completed' &&
        t.completedAt &&
        new Date(t.completedAt).toDateString() === today
    ).length;

    // 간단한 streak 계산 (실제로는 더 정교하게)
    const streak = calculateStreak();

    if (completedToday === 0) {
        setMessage('Ready to start your day? 💪');
        return;
    }

    try {
        setIsLoading(true);
        const ai = new OpenAIService();
        const encouragement = await ai.generateEncouragement(completedToday, streak);
        setMessage(encouragement);
    } catch (error) {
        console.error('Failed to generate encouragement:', error);
        setMessage(`${completedToday} tasks completed today! Great job! 🎉`);
    } finally {
        setIsLoading(false);
    }
    };

    const calculateStreak = (): number => {
    // 간단한 구현 (실제로는 DailyStats 사용)
    return 1;
    };

    useEffect(() => {
    generateMessage();
    }, [todos.filter(t => t.status === 'completed').length]);

    if (!message && !isLoading) return null;

    return (
    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
        <span className="text-2xl">🤖</span>
        <div className="flex-1">
            {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">
                AI is generating a message...
            </p>
            ) : (
            <p className="text-sm">{message}</p>
            )}
        </div>
        </div>
    </div>
    );
}
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatCompletionResponse {
    choices: Array<{
    message: {
        content: string;
    };
    }>;
}

export class OpenAIService {
    private apiKey: string;
    private baseUrl = 'https://api.openai.com/v1';

    constructor() {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
        throw new Error('OpenAI API key not configured');
    }
    this.apiKey = key;
    }

    private async chat(messages: ChatMessage[], temperature = 0.7): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature,
        max_tokens: 1000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0].message.content;
    }

    /**
     * 격려 메시지 생성
     */
    async generateEncouragement(completedCount: number, streak: number): Promise<string> {
    const messages: ChatMessage[] = [
        {
        role: 'system',
        content: 'You are a friendly and encouraging TODO app assistant. Generate short, motivational messages (1-2 sentences) in Korean.',
        },
        {
        role: 'user',
        content: `사용자가 오늘 ${completedCount}개의 TODO를 완료했고, ${streak}일 연속으로 목표를 달성했습니다. 짧고 긍정적인 격려        
메시지를 생성해주세요.`,
        },
    ];

    return this.chat(messages, 0.8);
    }

    /**
     * TODO 목표를 작은 단계로 분해
     */
    async breakdownTask(taskTitle: string): Promise<Array<{
    title: string;
    estimatedTime: number;
    }>> {
    const messages: ChatMessage[] = [
        {
        role: 'system',
        content: `You are a helpful assistant that breaks down large tasks into smaller, actionable steps.
        Return ONLY a JSON array of objects with "title" (string, in Korean) and "estimatedTime" (number in minutes).
        Each step should be completable in 30 minutes to 2 hours.`,
        },
        {
        role: 'user',
        content: `다음 작업을 구체적인 작은 단계로 분해해주세요: "${taskTitle}"

        JSON 형식으로만 응답해주세요:
        [{"title": "단계 제목", "estimatedTime": 30}, ...]`,
        },
    ];

    const response = await this.chat(messages, 0.5);

    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('Failed to parse AI response:', response);
        throw new Error('AI 응답을 파싱할 수 없습니다');
    }
    }

    /**
     * TODO 예상 소요 시간 예측
     */
    async estimateTime(taskTitle: string): Promise<number> {
    const messages: ChatMessage[] = [
        {
        role: 'system',
        content: 'You estimate task completion time. Return ONLY a number (in minutes).',
        },
        {
        role: 'user',
        content: `How many minutes will this task take? "${taskTitle}"\nReturn only a number.`,
        },
    ];

    const response = await this.chat(messages, 0.3);
    const minutes = parseInt(response.replace(/\D/g, ''), 10);

    return isNaN(minutes) ? 30 : minutes;
    }

    /**
     * 다음에 할 작업 추천
     */
    async suggestNextTask(todos: Array<{ title: string; priority: string }>): Promise<string> {
    const todoList = todos
        .map((t, i) => `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}`)
        .join('\n');

    const messages: ChatMessage[] = [
        {
        role: 'system',
        content: 'You are a productivity assistant. Suggest which task to work on next. Reply in Korean, 1-2 sentences.',
        },
        {
        role: 'user',
        content: `다음 TODO 중 어떤 것부터 시작하면 좋을까요?\n\n${todoList}`,
        },
    ];

    return this.chat(messages, 0.7);
    }

    /**
     * 커밋 diff를 분석해서 완료된 TODO 찾기 (새로 추가!)
     */
    async analyzeCommitForTodos(
    commitMessage: string,
    commitDiff: string,
    todos: Array<{ id: string; title: string; description?: string }>
    ): Promise<string[]> {
    // diff가 너무 길면 요약 (토큰 제한)
    const truncatedDiff = commitDiff.length > 3000
        ? commitDiff.substring(0, 3000) + '\n... (truncated)'
        : commitDiff;

    const todoList = todos
        .map((t) => `ID: ${t.id}\nTitle: ${t.title}${t.description ? `\nDescription: ${t.description}` : ''}`)
        .join('\n\n');

    const messages: ChatMessage[] = [
        {
        role: 'system',
        content: `You are an expert code analyzer. Analyze git commit changes and determine which TODOs were completed.

        Return ONLY a JSON array of TODO IDs that were completed by this commit.
        Be conservative - only mark a TODO as complete if the changes clearly implement that specific task.

        Example response: ["id1", "id2"]
        If no TODOs were completed, return: []`,
        },
        {
        role: 'user',
        content: `Commit Message:
${commitMessage}

Commit Changes (diff):
${truncatedDiff}

Pending TODOs:
${todoList}

Which TODO IDs were completed by this commit? Return ONLY a JSON array of IDs.`,
        },
    ];

    const response = await this.chat(messages, 0.3);

    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const completedIds = JSON.parse(cleaned);

        if (!Array.isArray(completedIds)) {
        return [];
        }

        return completedIds.filter((id: any) => typeof id === 'string');
    } catch (error) {
        console.error('Failed to parse AI commit analysis:', response);
        return [];
    }
    }
}
import { create } from 'zustand';
import type { Todo } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';
import { useStreakStore } from './streakStore';
import { useAchievementStore } from './achievementStore';

interface TodoStore {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'status'> & { status?: Todo['status'] }) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodoStatus: (id: string) => void;
  loadTodos: () => void;
  setTodos: (todos: Todo[]) => void;
  generateRecurringTodos: () => void;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],

  addTodo: (todoData) => {
    const newTodo: Todo = {
      ...todoData,
      status: todoData.status || 'pending',
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [...get().todos, newTodo];
    set({ todos: updatedTodos });
    setItem(STORAGE_KEYS.TODOS, updatedTodos);

    // 반복 TODO 설정 업적 체크
    if (todoData.isRecurring) {
      useAchievementStore.getState().checkAndUnlock('special', 1, 'recurring_setup');
    }
  },

  updateTodo: (id, updates) => {
    const updatedTodos = get().todos.map((todo) =>
      todo.id === id ? { ...todo, ...updates } : todo
    );
    set({ todos: updatedTodos });
    setItem(STORAGE_KEYS.TODOS, updatedTodos);
  },

  deleteTodo: (id) => {
    const updatedTodos = get().todos.filter((todo) => todo.id !== id);
    set({ todos: updatedTodos });
    setItem(STORAGE_KEYS.TODOS, updatedTodos);
  },

  toggleTodoStatus: (id) => {
    const todo = get().todos.find((t) => t.id === id);
    if (!todo) return;

    const newStatus: Todo['status'] =
      todo.status === 'completed' ? 'pending' : 'completed';

    const updates: Partial<Todo> = {
      status: newStatus,
      ...(newStatus === 'completed' && { completedAt: new Date().toISOString() }),
    };

    get().updateTodo(id, updates);

    // Update streak and achievements when task is completed
    if (newStatus === 'completed') {
      useStreakStore.getState().recordCompletion();

      // 업적 체크
      const allTodos = get().todos;
      const completedCount = allTodos.filter((t) => t.status === 'completed').length;
      const today = new Date().toISOString().split('T')[0];
      const todayCompletedCount = allTodos.filter(
        (t) => t.status === 'completed' && t.completedAt?.startsWith(today)
      ).length;

      const { checkAndUnlock } = useAchievementStore.getState();
      checkAndUnlock('completion', completedCount);
      checkAndUnlock('daily', todayCompletedCount);
    }
  },

  loadTodos: () => {
    const savedTodos = getItem<Todo[]>(STORAGE_KEYS.TODOS, []);
    set({ todos: savedTodos });
  },

  setTodos: (todos) => {
    set({ todos });
    setItem(STORAGE_KEYS.TODOS, todos);
  },

  generateRecurringTodos: () => {
    const todos = get().todos;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 오늘 이미 생성된 반복 TODO의 원본 ID를 추적
    const generatedFromIds = new Set(
      todos
        .filter((t) => t.createdAt.startsWith(todayStr) && t.generatedFromId)
        .map((t) => t.generatedFromId)
    );

    const newTodos: Todo[] = [];

    todos.forEach((todo) => {
      // 반복 설정이 없거나 이미 오늘 생성됨
      if (!todo.isRecurring || !todo.recurringPattern) return;
      if (generatedFromIds.has(todo.id)) return;

      // 완료된 반복 TODO만 다음 인스턴스 생성
      if (todo.status !== 'completed') return;

      const completedDate = todo.completedAt ? new Date(todo.completedAt) : null;
      if (!completedDate) return;
      completedDate.setHours(0, 0, 0, 0);

      let shouldGenerate = false;

      switch (todo.recurringPattern) {
        case 'daily':
          // 매일: 완료일이 오늘 이전이면 생성
          shouldGenerate = completedDate < today;
          break;
        case 'weekly':
          // 매주: 완료일로부터 7일이 지났으면 생성
          const weekLater = new Date(completedDate);
          weekLater.setDate(weekLater.getDate() + 7);
          shouldGenerate = weekLater <= today;
          break;
        case 'monthly':
          // 매월: 완료일로부터 한 달이 지났으면 생성
          const monthLater = new Date(completedDate);
          monthLater.setMonth(monthLater.getMonth() + 1);
          shouldGenerate = monthLater <= today;
          break;
      }

      if (shouldGenerate) {
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          title: todo.title,
          description: todo.description,
          priority: todo.priority,
          status: 'pending',
          estimatedTime: todo.estimatedTime,
          projectId: todo.projectId,
          isRecurring: true,
          recurringPattern: todo.recurringPattern,
          createdAt: new Date().toISOString(),
          generatedFromId: todo.id,
        };
        newTodos.push(newTodo);
      }
    });

    if (newTodos.length > 0) {
      const updatedTodos = [...todos, ...newTodos];
      set({ todos: updatedTodos });
      setItem(STORAGE_KEYS.TODOS, updatedTodos);
    }
  },
}));

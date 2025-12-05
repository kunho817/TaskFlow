import { useEffect, useRef } from 'react';
import { useTodoStore } from '@/store/todoStore';

/**
 * 반복 TODO 자동 생성 훅
 * 앱 로드 시 및 하루에 한 번 반복 TODO를 체크하고 새 인스턴스를 생성합니다.
 */
export function useRecurringTodos() {
  const { todos, generateRecurringTodos } = useTodoStore();
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // 오늘 이미 체크했으면 스킵
    if (lastCheckRef.current === today) return;

    // todos가 로드된 후에만 실행
    if (todos.length === 0) return;

    lastCheckRef.current = today;
    generateRecurringTodos();
  }, [todos, generateRecurringTodos]);

  return null;
}

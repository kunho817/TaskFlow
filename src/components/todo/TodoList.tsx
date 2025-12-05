import { useState } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { useProjectStore } from '@/store/projectStore';
import TodoItem from './TodoItem';
import { TodoListSkeleton } from './TodoItemSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, CheckCircle2, ListTodo, Search } from 'lucide-react';

import type { Todo } from '@/types';

interface TodoListProps {
  projectId?: string | null;
  searchResults?: Todo[] | null;
  isLoading?: boolean;
}

type FilterType = 'all' | 'pending' | 'completed';

export default function TodoList({ projectId, searchResults, isLoading }: TodoListProps) {
  const todos = useTodoStore((state) => state.todos);
  const projects = useProjectStore((state) => state.projects);
  const [filter, setFilter] = useState<FilterType>('all');

  // Use search results if provided, otherwise use project filtering
  const isSearchActive = searchResults !== undefined && searchResults !== null;

  // Project filtering (only used when not searching)
  const projectFilteredTodos = isSearchActive
    ? searchResults
    : projectId === null || projectId === undefined
      ? todos
      : todos.filter((t) => t.projectId === projectId);

  // Status filtering
  const filteredTodos =
    filter === 'all'
      ? projectFilteredTodos
      : filter === 'pending'
      ? projectFilteredTodos.filter((t) => t.status !== 'completed')
      : projectFilteredTodos.filter((t) => t.status === 'completed');

  // Priority ordering
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  // Sort: incomplete first, then by priority, then by creation date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Count stats
  const pendingCount = projectFilteredTodos.filter(
    (t) => t.status !== 'completed'
  ).length;
  const completedCount = projectFilteredTodos.filter(
    (t) => t.status === 'completed'
  ).length;

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {projectId && selectedProject ? selectedProject.name : 'All Tasks'}
        </h2>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">
              All ({projectFilteredTodos.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-3">
              To Do ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-3">
              Done ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Todo List */}
      {isLoading ? (
        <TodoListSkeleton count={3} />
      ) : sortedTodos.length === 0 ? (
        <EmptyState
          icon={
            isSearchActive
              ? Search
              : filter === 'completed'
              ? CheckCircle2
              : filter === 'pending'
              ? ListTodo
              : ClipboardList
          }
          title={
            isSearchActive
              ? 'No matching tasks'
              : filter === 'completed'
              ? 'No completed tasks yet'
              : filter === 'pending'
              ? 'All caught up!'
              : 'No tasks yet'
          }
          description={
            isSearchActive
              ? 'Try adjusting your search or filters'
              : filter === 'all'
              ? 'Add your first task to get started'
              : filter === 'pending'
              ? 'Great job! All tasks are completed'
              : 'Complete some tasks to see them here'
          }
        />
      ) : (
        <div className="space-y-3">
          {sortedTodos.map((todo, index) => (
            <div
              key={todo.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <TodoItem todo={todo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

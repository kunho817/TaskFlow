import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, X, Filter } from 'lucide-react';
import { useTodoStore } from '@/store/todoStore';
import { useProjectStore } from '@/store/projectStore';
import type { Todo, Priority } from '@/types';
import { cn } from '@/lib/utils';

interface TodoSearchProps {
  onSearchResults: (results: Todo[] | null) => void;
}

export default function TodoSearch({ onSearchResults }: TodoSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const todos = useTodoStore((state) => state.todos);
  const projects = useProjectStore((state) => state.projects);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  // Search and filter logic
  const filteredTodos = useMemo(() => {
    if (!searchQuery && priorityFilter === 'all' && statusFilter === 'all') {
      return null; // No active search/filter
    }

    return todos.filter((todo) => {
      // Text search
      const matchesSearch =
        !searchQuery ||
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (todo.projectId && projectMap.get(todo.projectId)?.toLowerCase().includes(searchQuery.toLowerCase()));

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || todo.priority === priorityFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || todo.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [todos, searchQuery, priorityFilter, statusFilter, projectMap]);

  // Update parent with search results
  useEffect(() => {
    onSearchResults(filteredTodos);
  }, [filteredTodos, onSearchResults]);

  const handleClear = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || priorityFilter !== 'all' || statusFilter !== 'all';
  const resultCount = filteredTodos?.length ?? 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Popover */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className={cn(hasActiveFilters && 'border-primary')}>
              <Filter className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Priority</p>
                <div className="flex flex-wrap gap-1">
                  {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                    <Button
                      key={p}
                      variant={priorityFilter === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter(p)}
                      className="text-xs"
                    >
                      {p === 'all' ? 'All' : p === 'high' ? 'High' : p === 'medium' ? 'Medium' : 'Low'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Status</p>
                <div className="flex flex-wrap gap-1">
                  {(['all', 'pending', 'completed'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={statusFilter === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(s)}
                      className="text-xs"
                    >
                      {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : 'Completed'}
                    </Button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="w-full">
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters / Results Count */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {resultCount} results
          </span>

          {priorityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {priorityFilter === 'high' ? 'High' : priorityFilter === 'medium' ? 'Medium' : 'Low'}
              <button onClick={() => setPriorityFilter('all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {statusFilter === 'pending' ? 'Pending' : 'Completed'}
              <button onClick={() => setStatusFilter('all')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

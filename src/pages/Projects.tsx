import { useEffect, useState, useCallback } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { useProjectStore } from '@/store/projectStore';
import { useGitHubStore } from '@/store/githubStore';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import TodoList from '@/components/todo/TodoList';
import AddTodoForm from '@/components/todo/AddTodoForm';
import TodoSearch from '@/components/todo/TodoSearch';
import TaskBreakdownModal from '@/components/ai/TaskBreakdownModal';
import CreateProjectModal from '@/components/project/CreateProjectModal';
import type { Todo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, RefreshCw, FolderPlus, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Projects() {
  const { loadTodos } = useTodoStore();
  const { projects, selectedProjectId, selectProject, loadProjects } = useProjectStore();
  const { connection } = useGitHubStore();
  const { syncCommits, isSyncing } = useGitHubSync();

  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Todo[] | null>(null);

  const handleSearchResults = useCallback((results: Todo[] | null) => {
    setSearchResults(results);
  }, []);

  useEffect(() => {
    loadTodos();
    loadProjects();
  }, [loadTodos, loadProjects]);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
        <div className="flex gap-2">
          {connection.isConnected && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => syncCommits()}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowCreateProjectModal(true)}
            className="hidden md:flex"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Project
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowCreateProjectModal(true)}
            className="md:hidden"
          >
            <FolderPlus className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowBreakdownModal(true)}>
            <Sparkles className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">AI Breakdown</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar - Project List */}
        <aside className="hidden md:block w-64 shrink-0">
          <Card className="sticky top-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderKanban className="w-4 h-4" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => selectProject(null)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selectedProjectId === null
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                All Projects
              </button>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2',
                    selectedProjectId === project.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${project.color}`} />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No projects yet
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Project Selector */}
        <Card className="md:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId || 'all'}
              onValueChange={(value) => selectProject(value === 'all' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${project.color}`} />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Search */}
          <TodoSearch onSearchResults={handleSearchResults} />

          {/* Add Todo Form */}
          <AddTodoForm />

          {/* Todo List */}
          <TodoList projectId={selectedProjectId} searchResults={searchResults} isLoading={isSyncing} />
        </div>
      </div>

      {/* Modals */}
      <TaskBreakdownModal
        isOpen={showBreakdownModal}
        onClose={() => setShowBreakdownModal(false)}
      />
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
      />
    </div>
  );
}

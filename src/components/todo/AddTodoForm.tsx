import { useState } from 'react';
import { format } from 'date-fns';
import { useTodoStore } from '@/store/todoStore';
import { useProjectStore } from '@/store/projectStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, ChevronDown, ChevronUp, GitBranch, Clock, CalendarIcon, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Priority, RecurringPattern } from '@/types';

const TIME_PRESETS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '240', label: '4 hours' },
] as const;

const RECURRING_PRESETS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export default function AddTodoForm() {
  const addTodo = useTodoStore((state) => state.addTodo);
  const { projects, selectedProjectId } = useProjectStore();

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(
    selectedProjectId || undefined
  );
  const [githubBranch, setGithubBranch] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern | ''>('');

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      return 'Task title is required';
    }
    if (value.trim().length < 2) {
      return 'Title must be at least 2 characters';
    }
    return '';
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleError) {
      setTitleError(validateTitle(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateTitle(title);
    if (error) {
      setTitleError(error);
      return;
    }

    addTodo({
      title: title.trim(),
      priority,
      projectId: projectId || selectedProjectId || undefined,
      githubBranch: githubBranch || undefined,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      isRecurring: !!recurringPattern,
      recurringPattern: recurringPattern || undefined,
    });

    // Reset form
    setTitle('');
    setTitleError('');
    setPriority('medium');
    setGithubBranch('');
    setEstimatedTime('');
    setDueDate(undefined);
    setRecurringPattern('');
    // Keep projectId if there's a selected project
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Add Row */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={cn('flex-1', titleError && 'border-destructive focus-visible:ring-destructive')}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
              />
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    High
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Low
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
            </div>
            {titleError && (
              <p id="title-error" className="text-sm text-destructive">
                {titleError}
              </p>
            )}
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showAdvanced ? 'Hide options' : 'More options'}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {/* Project Selection */}
              <Select
                value={projectId || 'none'}
                onValueChange={(v) => setProjectId(v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${project.color}`} />
                        {project.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Estimated Time */}
              <Select
                value={estimatedTime || 'none'}
                onValueChange={(v) => setEstimatedTime(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Est. time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {TIME_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Due Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'MM/dd (EEE)') : 'Due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setDueDate(undefined)}
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* GitHub Branch */}
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Branch name"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  className="pl-9 font-mono text-sm"
                />
              </div>

              {/* Recurring Pattern */}
              <Select
                value={recurringPattern || 'none'}
                onValueChange={(v) => setRecurringPattern(v === 'none' ? '' : v as RecurringPattern)}
              >
                <SelectTrigger className={cn(recurringPattern && 'border-primary')}>
                  <Repeat className={cn('w-4 h-4 mr-2', recurringPattern ? 'text-primary' : 'text-muted-foreground')} />
                  <SelectValue placeholder="Repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem>
                  {RECURRING_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

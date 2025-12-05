import { useState, useEffect } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useTodoStore } from '@/store/todoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
  Bug,
  Lightbulb,
  Flag,
  Trash2,
  Link,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { RoadmapItemType, Priority } from '@/types';

const typeConfig = {
  feature: { icon: Target, color: 'bg-blue-500', label: 'Feature' },
  milestone: { icon: Flag, color: 'bg-purple-500', label: 'Milestone' },
  bugfix: { icon: Bug, color: 'bg-red-500', label: 'Bug Fix' },
  research: { icon: Lightbulb, color: 'bg-yellow-500', label: 'Research' },
};

const priorityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
} as const;

export default function Roadmap() {
  const { items, loadItems, addItem, deleteItem } = useRoadmapStore();
  const { todos, loadTodos, updateTodo, toggleTodoStatus } = useTodoStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkSheet, setShowLinkSheet] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<RoadmapItemType>('feature');
  const [priority, setPriority] = useState<Priority>('medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadItems();
    loadTodos();
  }, [loadItems, loadTodos]);

  const currentMonth = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Filter items for current month
  const currentMonthItems = items.filter((item) => {
    const itemStart = new Date(item.startDate);
    const itemEnd = new Date(item.endDate);
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    return itemStart <= monthEnd && itemEnd >= monthStart;
  });

  const handleAddItem = () => {
    if (!title.trim() || !startDate || !endDate) return;

    addItem({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      priority,
      startDate,
      endDate,
      status: 'pending',
      todos: [],
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('feature');
    setPriority('medium');
    setStartDate('');
    setEndDate('');
    setShowAddModal(false);
  };

  // Get todos linked to a roadmap item
  const getLinkedTodos = (itemId: string) => {
    return todos.filter((todo) => todo.roadmapItemId === itemId);
  };

  // Calculate progress based on linked todos
  const calculateProgress = (itemId: string) => {
    const linkedTodos = getLinkedTodos(itemId);
    if (linkedTodos.length === 0) return 0;

    const completedCount = linkedTodos.filter((t) => t.status === 'completed').length;
    return Math.round((completedCount / linkedTodos.length) * 100);
  };

  // Get unlinked todos (for linking)
  const getUnlinkedTodos = () => {
    return todos.filter((todo) => !todo.roadmapItemId && todo.status !== 'completed');
  };

  // Link/unlink todo to roadmap item
  const toggleTodoLink = (todoId: string, itemId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    if (todo.roadmapItemId === itemId) {
      // Unlink
      updateTodo(todoId, { roadmapItemId: undefined });
    } else {
      // Link
      updateTodo(todoId, { roadmapItemId: itemId });
    }
  };

  const openLinkSheet = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowLinkSheet(true);
  };

  const selectedItem = items.find((item) => item.id === selectedItemId);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Roadmap</h1>
        <div className="flex items-center gap-2">
          {/* Month Navigation - Desktop inline */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-lg font-semibold min-w-[160px] text-center">{currentMonth}</span>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            Add Milestone
          </Button>
          <Button size="icon" onClick={() => setShowAddModal(true)} className="md:hidden">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Month Navigation - Mobile */}
      <div className="flex items-center justify-between md:hidden">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">{currentMonth}</h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentMonthItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No milestones this month</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first milestone to start planning
              </p>
            </CardContent>
          </Card>
        ) : (
          currentMonthItems.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            const progress = calculateProgress(item.id);
            const linkedTodos = getLinkedTodos(item.id);

            return (
              <Card key={item.id} className="overflow-hidden">
                <div className={`h-1 ${config.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${config.color} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={priorityColors[item.priority]}>
                        {item.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openLinkSheet(item.id)}
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}

                  {/* Linked Todos Preview */}
                  {linkedTodos.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Linked Tasks ({linkedTodos.filter((t) => t.status === 'completed').length}/{linkedTodos.length})
                      </p>
                      <div className="space-y-1">
                        {linkedTodos.slice(0, 3).map((todo) => (
                          <div
                            key={todo.id}
                            className="flex items-center gap-2 text-sm"
                            onClick={() => toggleTodoStatus(todo.id)}
                          >
                            {todo.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                              {todo.title}
                            </span>
                          </div>
                        ))}
                        {linkedTodos.length > 3 && (
                          <p className="text-xs text-muted-foreground pl-6">
                            +{linkedTodos.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(item.startDate).toLocaleDateString()} -{' '}
                      {new Date(item.endDate).toLocaleDateString()}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              New Milestone
            </DialogTitle>
            <DialogDescription>
              Add a new milestone to your roadmap
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., User Authentication"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={type} onValueChange={(v) => setType(v as RoadmapItemType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="bugfix">Bug Fix</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date *</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={!title.trim() || !startDate || !endDate}
                className="flex-1"
              >
                Add Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Todos Sheet */}
      <Sheet open={showLinkSheet} onOpenChange={setShowLinkSheet}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Link Tasks to "{selectedItem?.title}"
            </SheetTitle>
            <SheetDescription>
              Select tasks to link to this milestone. Linked tasks will contribute to progress.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(70vh-120px)]">
            {/* Currently Linked */}
            {selectedItemId && getLinkedTodos(selectedItemId).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Linked Tasks</h4>
                {getLinkedTodos(selectedItemId).map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => selectedItemId && toggleTodoLink(todo.id, selectedItemId)}
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.title}
                      </p>
                    </div>
                    {todo.status === 'completed' && (
                      <Badge variant="secondary" className="text-xs">Done</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Available to Link */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Available Tasks ({getUnlinkedTodos().length})
              </h4>
              {getUnlinkedTodos().length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No available tasks to link. Create tasks in Projects first.
                </p>
              ) : (
                getUnlinkedTodos().map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectedItemId && toggleTodoLink(todo.id, selectedItemId)}
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => selectedItemId && toggleTodoLink(todo.id, selectedItemId)}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{todo.title}</p>
                      {todo.projectId && (
                        <p className="text-xs text-muted-foreground">Has project</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

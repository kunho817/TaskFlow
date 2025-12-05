import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useGitHubStore } from '@/store/githubStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPlus, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { name: 'Blue', class: 'bg-blue-500' },
  { name: 'Green', class: 'bg-green-500' },
  { name: 'Purple', class: 'bg-purple-500' },
  { name: 'Red', class: 'bg-red-500' },
  { name: 'Yellow', class: 'bg-yellow-500' },
  { name: 'Pink', class: 'bg-pink-500' },
  { name: 'Indigo', class: 'bg-indigo-500' },
  { name: 'Teal', class: 'bg-teal-500' },
];

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].class);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');

  const addProject = useProjectStore((state) => state.addProject);
  const { repos, connection } = useGitHubStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const repoId = selectedRepoId ? Number(selectedRepoId) : undefined;
    const selectedRepo = repos.find((r) => r.id === repoId);

    addProject({
      name: name.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      githubRepoId: repoId,
      githubRepoName: selectedRepo?.full_name,
    });

    // Reset
    setName('');
    setDescription('');
    setSelectedColor(COLORS[0].class);
    setSelectedRepoId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            New Project
          </DialogTitle>
          <DialogDescription>
            Create a new project to organize your tasks
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., TaskFlow App"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description..."
              rows={3}
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.class}
                  type="button"
                  onClick={() => setSelectedColor(color.class)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color.class,
                    selectedColor === color.class
                      ? 'ring-2 ring-offset-2 ring-ring scale-110'
                      : 'hover:scale-105'
                  )}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* GitHub Repo Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Repository
            </label>
            <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
              <SelectTrigger>
                <SelectValue placeholder="No repository linked" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No repository linked</SelectItem>
                {repos.map((repo) => (
                  <SelectItem key={repo.id} value={String(repo.id)}>
                    {repo.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!connection.isConnected && (
              <p className="text-xs text-muted-foreground">
                Connect GitHub in Profile to link repositories
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

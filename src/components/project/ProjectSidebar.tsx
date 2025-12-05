import { useEffect, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useTodoStore } from '../../store/todoStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectSidebarProps {
    onCreateProject: () => void;
}

export default function ProjectSidebar({ onCreateProject }: ProjectSidebarProps) {
    const { projects, selectedProjectId, selectProject, loadProjects, deleteProject } = useProjectStore();
    const todos = useTodoStore((state) => state.todos);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
    loadProjects();
    }, [loadProjects]);

    const getTodoCount = (projectId: string) => {
    return todos.filter(t => t.projectId === projectId && t.status !== 'completed').length;
    };

    const getAllTodoCount = () => {
    return todos.filter(t => t.status !== 'completed').length;
    };

    return (
    <div className="w-64 bg-card border-r p-4 space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <button
            onClick={onCreateProject}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="New Project"
        >
            <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"
stroke="currentColor">
            <path d="M12 4v16m8-8H4"></path>
            </svg>
        </button>
        </div>

        {/* All TODOs */}
        <button
        onClick={() => selectProject(null)}
        className={`w-full p-3 rounded-lg text-left transition-colors ${
            selectedProjectId === null
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent'
        }`}
        >
        <div className="flex items-center justify-between">
            <span className="font-medium">📋 All</span>
            <span className="text-sm">{getAllTodoCount()}</span>
        </div>
        </button>

        {/* Project list */}
        <div className="space-y-2">
        {projects.map((project) => (
            <div
            key={project.id}
            className={`group relative p-3 rounded-lg transition-colors ${
                selectedProjectId === project.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
            >
            <button
                onClick={() => selectProject(project.id)}
                className="w-full text-left"
            >
                <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${project.color}`}></div>
                <span className="font-medium flex-1 truncate">{project.name}</span>
                <span className="text-sm">{getTodoCount(project.id)}</span>
                </div>
                {project.githubRepoName && (
                <p className="text-xs mt-1 opacity-70 truncate">
                    🔗 {project.githubRepoName}
                </p>
                )}
            </button>

            {/* Delete button */}
            <button
                onClick={(e) => {
                e.stopPropagation();
                setProjectToDelete({ id: project.id, name: project.name });
                }}
                className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-opacity"
            >
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            </div>
        ))}
        </div>

        {projects.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
            Create a project to get started
        </p>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete "{projectToDelete?.name}"? All tasks in this project will be unassigned. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={() => {
                if (projectToDelete) {
                    deleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </div>
    );
}
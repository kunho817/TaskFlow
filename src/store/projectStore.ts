import { create } from 'zustand';
import type { Project } from '../types';
import { getItem, setItem } from '../lib/storage';
import { useAchievementStore } from './achievementStore';

interface ProjectStore {
    projects: Project[];
    selectedProjectId: string | null;

    addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;
    selectProject: (id: string | null) => void;
    loadProjects: () => void;
    setProjects: (projects: Project[]) => void;
}

const STORAGE_KEY = 'taskflow_projects';

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    selectedProjectId: null,

    addProject: (projectData) => {
    const newProject: Project = {
        ...projectData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const updatedProjects = [...get().projects, newProject];
    set({ projects: updatedProjects });
    setItem(STORAGE_KEY, updatedProjects);

    // 첫 프로젝트 생성 업적 체크
    if (updatedProjects.length === 1) {
        useAchievementStore.getState().checkAndUnlock('special', 1, 'first_project');
    }
    },

    updateProject: (id, updates) => {
    const updatedProjects = get().projects.map((project) =>
        project.id === id
        ? { ...project, ...updates, updatedAt: new Date().toISOString() }
        : project
    );
    set({ projects: updatedProjects });
    setItem(STORAGE_KEY, updatedProjects);
    },

    deleteProject: (id) => {
    const updatedProjects = get().projects.filter((project) => project.id !== id);
    set({ projects: updatedProjects });
    setItem(STORAGE_KEY, updatedProjects);

    // 선택된 프로젝트가 삭제되면 선택 해제
    if (get().selectedProjectId === id) {
        set({ selectedProjectId: null });
    }
    },

    selectProject: (id) => {
    set({ selectedProjectId: id });
    },

    loadProjects: () => {
    const savedProjects = getItem<Project[]>(STORAGE_KEY, []);
    set({ projects: savedProjects });
    },

    setProjects: (projects) => {
    set({ projects });
    setItem(STORAGE_KEY, projects);
    },
}));
import { create } from 'zustand';
import type { RoadmapItem } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';

interface RoadmapStore {
  items: RoadmapItem[];
  addItem: (item: Omit<RoadmapItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<RoadmapItem>) => void;
  deleteItem: (id: string) => void;
  loadItems: () => void;
}

export const useRoadmapStore = create<RoadmapStore>((set, get) => ({
  items: [],

  addItem: (itemData) => {
    const newItem: RoadmapItem = {
      ...itemData,
      id: crypto.randomUUID(),
    };

    const updatedItems = [...get().items, newItem];
    set({ items: updatedItems });
    setItem(STORAGE_KEYS.ROADMAP_ITEMS, updatedItems);
  },

  updateItem: (id, updates) => {
    const updatedItems = get().items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    set({ items: updatedItems });
    setItem(STORAGE_KEYS.ROADMAP_ITEMS, updatedItems);
  },

  deleteItem: (id) => {
    const updatedItems = get().items.filter((item) => item.id !== id);
    set({ items: updatedItems });
    setItem(STORAGE_KEYS.ROADMAP_ITEMS, updatedItems);
  },

  loadItems: () => {
    const savedItems = getItem<RoadmapItem[]>(STORAGE_KEYS.ROADMAP_ITEMS, []);
    set({ items: savedItems });
  },
}));

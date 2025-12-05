import { create } from 'zustand';
import type { AIMessage } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../lib/storage';

interface AIStore {
    messages: AIMessage[];
    isProcessing: boolean;

    addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
    setProcessing: (processing: boolean) => void;
    clearMessages: () => void;
    loadMessages: () => void;
}

export const useAIStore = create<AIStore>((set, get) => ({
    messages: [],
    isProcessing: false,

    addMessage: (messageData) => {
    const newMessage: AIMessage = {
        ...messageData,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...get().messages, newMessage];
    set({ messages: updatedMessages });
    setItem(STORAGE_KEYS.AI_MESSAGES, updatedMessages);
    },

    setProcessing: (processing) => {
    set({ isProcessing: processing });
    },

    clearMessages: () => {
    set({ messages: [] });
    setItem(STORAGE_KEYS.AI_MESSAGES, []);
    },

    loadMessages: () => {
    const savedMessages = getItem<AIMessage[]>(STORAGE_KEYS.AI_MESSAGES, []);
    set({ messages: savedMessages });
    },
}));
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, ToolType } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTool: 'json',
      darkMode: false,
      favorites: [],
      setActiveTool: (tool: ToolType) => set({ activeTool: tool }),
      toggleDarkMode: () =>
        set((state) => {
          const newDarkMode = !state.darkMode;
          // Update document class for Tailwind dark mode
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newDarkMode };
        }),
      addFavorite: (tool: ToolType) =>
        set((state) => ({
          favorites: state.favorites.includes(tool)
            ? state.favorites
            : [...state.favorites, tool],
        })),
      removeFavorite: (tool: ToolType) =>
        set((state) => ({
          favorites: state.favorites.filter((t) => t !== tool),
        })),
    }),
    {
      name: 'dev-utils-storage',
      onRehydrateStorage: () => (state) => {
        // Apply dark mode on initial load
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);

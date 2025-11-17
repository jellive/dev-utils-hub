import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, ToolType } from '../types';

// Store for the beforeinstallprompt event
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  // Update the store to show the install button
  useAppStore.setState({ canInstallPWA: true });
});

// Listen for successful PWA installation
window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  useAppStore.setState({ canInstallPWA: false });
});

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTool: 'json',
      darkMode: false,
      favorites: [],
      canInstallPWA: false,
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
      installPWA: async () => {
        if (!deferredPrompt) {
          return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user's response
        const { outcome } = await deferredPrompt.userChoice;

        // Reset the deferred prompt variable
        deferredPrompt = null;

        // Hide the install button
        set({ canInstallPWA: false });

        console.log(`User response to the install prompt: ${outcome}`);
      },
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

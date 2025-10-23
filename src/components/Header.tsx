import { memo } from 'react';
import { useAppStore } from '../stores/useAppStore';

export const Header = memo(function Header() {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛠️</span>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Dev Utils Hub
          </h1>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          <span className="text-2xl">{darkMode ? '☀️' : '🌙'}</span>
        </button>
      </div>
    </header>
  );
});

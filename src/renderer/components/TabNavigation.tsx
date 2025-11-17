import { memo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { TOOLS } from '../utils/constants';
import type { ToolType } from '../types';

export const TabNavigation = memo(function TabNavigation() {
  const { activeTool, setActiveTool, favorites, addFavorite, removeFavorite } = useAppStore();

  const handleTabClick = (toolId: ToolType) => {
    setActiveTool(toolId);
  };

  const toggleFavorite = (toolId: ToolType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(toolId)) {
      removeFavorite(toolId);
    } else {
      addFavorite(toolId);
    }
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleTabClick(tool.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 whitespace-nowrap
                border-b-2 transition-colors duration-75
                ${
                  activeTool === tool.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-800'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className="text-lg">{tool.icon}</span>
              <span className="font-medium">{tool.name}</span>
              <button
                onClick={(e) => toggleFavorite(tool.id, e)}
                className="ml-1 text-sm hover:scale-110 transition-transform"
                aria-label={`Toggle favorite for ${tool.name}`}
              >
                {favorites.includes(tool.id) ? '⭐' : '☆'}
              </button>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
});

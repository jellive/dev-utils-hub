export type ToolType =
  | 'json'
  | 'jwt'
  | 'base64'
  | 'url'
  | 'regex'
  | 'diff'
  | 'hash';

export interface Tool {
  id: ToolType;
  name: string;
  icon: string;
  description: string;
}

export interface AppState {
  activeTool: ToolType;
  darkMode: boolean;
  favorites: ToolType[];
  setActiveTool: (tool: ToolType) => void;
  toggleDarkMode: () => void;
  addFavorite: (tool: ToolType) => void;
  removeFavorite: (tool: ToolType) => void;
}

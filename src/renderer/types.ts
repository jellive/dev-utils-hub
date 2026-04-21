export type ToolType =
  | 'json'
  | 'jwt'
  | 'base64'
  | 'url'
  | 'regex'
  | 'diff'
  | 'hash'
  | 'uuid'
  | 'timestamp'
  | 'api'
  | 'color-picker'
  | 'cron-parser'
  | 'markdown-preview'
  | 'css-converter'
  | 'ai-regex'
  | 'ai-json-schema'
  | 'ai-code-explainer';

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
  canInstallPWA: boolean;
  setActiveTool: (tool: ToolType) => void;
  toggleDarkMode: () => void;
  addFavorite: (tool: ToolType) => void;
  removeFavorite: (tool: ToolType) => void;
  installPWA: () => Promise<void>;
}

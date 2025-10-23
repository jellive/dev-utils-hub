// PWA BeforeInstallPrompt event type
declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export type ToolType =
  | 'json'
  | 'jwt'
  | 'base64'
  | 'url'
  | 'regex'
  | 'diff'
  | 'hash'
  | 'uuid';

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
  installPWA: () => void;
}

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { listen as tauriListen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  readText as clipboardRead,
  writeText as clipboardWrite,
  clear as clipboardClear,
} from '@tauri-apps/plugin-clipboard-manager';
import { save, open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

// The same renderer is also deployed as a plain web app (Vercel). When the
// host isn't Tauri, `window.__TAURI_INTERNALS__` is missing and every
// `invoke()` / `listen()` call throws `Cannot read properties of undefined`.
// Detect once at module load and replace each Tauri call with a safe no-op so
// the web build degrades silently instead of crashing components like
// HistorySidebar at mount.
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const invoke = isTauri
  ? tauriInvoke
  : <T = unknown>(_cmd: string, _args?: Record<string, unknown>): Promise<T> =>
      Promise.resolve(undefined as unknown as T);

const listen = isTauri
  ? tauriListen
  : <_T = unknown>(
      _event: string,
      _handler: (event: { payload: _T }) => void
    ): Promise<UnlistenFn> => Promise.resolve(() => {});

// ── Types ────────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: number;
  tool: string;
  input: string;
  output: string | null;
  metadata: string | null;
  favorite: number;
  created_at: number;
}

interface HistoryStats {
  total: number;
  by_tool: Record<string, number>;
  favorites: number;
  oldest_entry: number | null;
  newest_entry: number | null;
}

interface SaveFileResult {
  success: boolean;
  filePath?: string;
  error?: { code: string; message: string };
}

interface OpenFileResult {
  success: boolean;
  content?: string;
  filePath?: string;
  error?: { code: string; message: string };
}

interface BackupInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
}

// ── API Adapter ──────────────────────────────────────────────────────────────
// Drop-in replacement for `window.api` (Electron preload bridge).
// Same shape, backed by Tauri `invoke()` + plugin JS APIs.

export const api = {
  ping: (): Promise<string> => invoke<string>('ping'),
  getAppVersion: (): Promise<string> => invoke<string>('get_app_version'),
  getPlatformInfo: (): Promise<{ platform: string; arch: string }> => invoke('get_platform_info'),

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    get: <T = unknown>(key: string): Promise<T> => invoke('settings_get', { key }),
    set: (key: string, value: unknown): Promise<void> => invoke('settings_set', { key, value }),
    getAll: (): Promise<Record<string, unknown>> => invoke('settings_get_all'),
    reset: (): Promise<void> => invoke('settings_reset'),
    delete: (key: string): Promise<void> => invoke('settings_set', { key, value: null }),
    setAutoStart: async (_enabled: boolean, _startMinimized: boolean): Promise<boolean> => {
      // Handled via tauri-plugin-autostart on the Rust side during setup
      // Frontend just persists the preference
      await invoke('settings_set', {
        key: 'launchAtStartup',
        value: _enabled,
      });
      await invoke('settings_set', {
        key: 'startMinimized',
        value: _startMinimized,
      });
      return true;
    },
    getAutoStart: async (): Promise<{
      enabled: boolean;
      startMinimized: boolean;
      wasOpenedAtLogin: boolean;
      wasOpenedAsHidden: boolean;
    }> => {
      const enabled = await invoke<boolean>('settings_get', {
        key: 'launchAtStartup',
      });
      const startMinimized = await invoke<boolean>('settings_get', {
        key: 'startMinimized',
      });
      return {
        enabled: enabled ?? false,
        startMinimized: startMinimized ?? false,
        wasOpenedAtLogin: false,
        wasOpenedAsHidden: false,
      };
    },
  },

  // ── Shortcuts (event-based) ────────────────────────────────────────────────
  shortcuts: {
    onOpenSettings: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen('shortcut:open-settings', () => callback()).then(fn => (unlisten = fn));
      return () => unlisten?.();
    },
    onToggleHistory: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen('shortcut:toggle-history', () => callback()).then(fn => (unlisten = fn));
      return () => unlisten?.();
    },
    onSwitchTool: (callback: (route: string) => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<string>('shortcut:switch-tool', event => callback(event.payload)).then(
        fn => (unlisten = fn)
      );
      return () => unlisten?.();
    },
    getAll: (): Promise<unknown> => invoke('settings_get', { key: 'shortcuts' }),
    updateGlobal: async (_accelerator: string): Promise<boolean> => {
      // Global shortcut registration handled on Rust side
      await invoke('settings_set', {
        key: 'shortcuts',
        value: { toggleApp: _accelerator },
      });
      return true;
    },
    reset: async (): Promise<boolean> => {
      await invoke('settings_set', {
        key: 'shortcuts',
        value: { toggleApp: 'CommandOrControl+Shift+Space' },
      });
      return true;
    },
    validate: async (
      _accelerator: string
    ): Promise<{ valid: boolean; conflicts: string[]; warnings: string[] }> => {
      // Basic validation — Tauri handles conflict detection at registration time
      return { valid: true, conflicts: [], warnings: [] };
    },
    getRegistered: async (): Promise<
      Array<{ accelerator: string; scope: string; description: string }>
    > => {
      return [];
    },
  },

  // ── History ────────────────────────────────────────────────────────────────
  history: {
    save: (
      tool: string,
      input: string,
      output?: string,
      metadata?: Record<string, unknown>
    ): Promise<number> =>
      invoke('history_save', {
        tool,
        input,
        output: output ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }),
    get: (tool?: string, limit?: number): Promise<HistoryEntry[]> =>
      invoke('history_get', { tool: tool ?? null, limit: limit ?? null }),
    getWithOptions: (
      tool: string,
      options?: {
        limit?: number;
        offset?: number;
        favorites?: boolean;
        startDate?: number;
        endDate?: number;
      }
    ): Promise<HistoryEntry[]> =>
      invoke('history_get_with_options', {
        tool,
        limit: options?.limit ?? null,
        offset: options?.offset ?? null,
        favorites: options?.favorites ?? null,
        startDate: options?.startDate ?? null,
        endDate: options?.endDate ?? null,
      }),
    count: (tool: string): Promise<number> => invoke('history_count', { tool }),
    search: (tool: string, query: string, limit?: number): Promise<HistoryEntry[]> =>
      invoke('history_search', { tool, query, limit: limit ?? null }),
    getById: (id: number): Promise<HistoryEntry | null> => invoke('history_get_by_id', { id }),
    delete: (id: number): Promise<boolean> => invoke('history_delete', { id }),
    toggleFavorite: (id: number): Promise<boolean> => invoke('history_toggle_favorite', { id }),
    clear: (tool: string): Promise<number> => invoke('history_clear', { tool }),
    clearAll: (): Promise<number> => invoke('history_clear_all'),
    autoCleanup: (daysOld?: number, keepFavorites?: boolean): Promise<number> =>
      invoke('history_auto_cleanup', {
        daysOld: daysOld ?? null,
        keepFavorites: keepFavorites ?? null,
      }),
    stats: (): Promise<HistoryStats> => invoke('history_stats'),
    // Event listeners (from menu/tray actions)
    onToggle: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen('toggle-history-panel', () => callback()).then(fn => (unlisten = fn));
      return () => unlisten?.();
    },
    onExport: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen('trigger-export', () => callback()).then(fn => (unlisten = fn));
      return () => unlisten?.();
    },
    onImport: (callback: () => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen('trigger-import', () => callback()).then(fn => (unlisten = fn));
      return () => unlisten?.();
    },
  },

  // ── Maintenance ────────────────────────────────────────────────────────────
  maintenance: {
    cleanup: (dryRun?: boolean): Promise<number> =>
      invoke('maintenance_cleanup', { dryRun: dryRun ?? null }),
    backup: (): Promise<string> => invoke('maintenance_backup'),
    restore: (backupPath: string): Promise<void> => invoke('maintenance_restore', { backupPath }),
    stats: (): Promise<unknown> => invoke('maintenance_stats'),
    listBackups: (): Promise<BackupInfo[]> => invoke('maintenance_list_backups'),
  },

  // ── Clipboard (via plugin JS API) ──────────────────────────────────────────
  clipboard: {
    readText: (): Promise<string> => clipboardRead(),
    writeText: async (text: string): Promise<boolean> => {
      await clipboardWrite(text);
      return true;
    },
    clear: async (): Promise<boolean> => {
      await clipboardClear();
      return true;
    },
  },

  // ── File System (dialog plugin + fs plugin) ────────────────────────────────
  file: {
    save: async (
      content: string,
      defaultFileName?: string,
      _filters?: unknown
    ): Promise<SaveFileResult> => {
      const filePath = await save({
        defaultPath: defaultFileName || 'untitled.txt',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (!filePath) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'File selection cancelled' },
        };
      }
      await writeTextFile(filePath, content);
      return { success: true, filePath };
    },
    open: async (_filters?: unknown): Promise<OpenFileResult> => {
      const selected = await open({
        multiple: false,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });
      if (!selected) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'File selection cancelled' },
        };
      }
      const filePath = typeof selected === 'string' ? selected : selected;
      const content = await readTextFile(filePath as string);
      return { success: true, content, filePath: filePath as string };
    },
  },

  // ── Navigation (event-based) ───────────────────────────────────────────────
  navigation: {
    onNavigateToTool: (callback: (path: string) => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<string>('navigate-to-tool', event => callback(event.payload)).then(
        fn => (unlisten = fn)
      );
      return () => unlisten?.();
    },
    onNavigateTo: (callback: (path: string) => void): (() => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<string>('navigate-to', event => callback(event.payload)).then(fn => (unlisten = fn));
      return () => unlisten?.();
    },
  },
};

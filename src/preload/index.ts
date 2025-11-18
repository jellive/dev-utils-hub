import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Platform information interface
interface PlatformInfo {
  platform: NodeJS.Platform
  arch: string
  version: string
  versions: NodeJS.ProcessVersions
}

// Custom APIs for renderer
const api = {
  // Test IPC communication
  ping: (): Promise<string> => ipcRenderer.invoke('ping'),

  // Get application version
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

  // Get platform information
  getPlatformInfo: (): Promise<PlatformInfo> => ipcRenderer.invoke('platform-info'),

  // Settings API
  settings: {
    get: <T = any>(key: string): Promise<T> => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
    getAll: (): Promise<Record<string, any>> => ipcRenderer.invoke('settings:get-all'),
    reset: (): Promise<boolean> => ipcRenderer.invoke('settings:reset'),
    delete: (key: string): Promise<boolean> => ipcRenderer.invoke('settings:delete', key)
  },

  // Shortcut events API
  shortcuts: {
    onOpenSettings: (callback: () => void) => {
      ipcRenderer.on('shortcut:open-settings', callback)
      return () => ipcRenderer.removeListener('shortcut:open-settings', callback)
    },
    onToggleHistory: (callback: () => void) => {
      ipcRenderer.on('shortcut:toggle-history', callback)
      return () => ipcRenderer.removeListener('shortcut:toggle-history', callback)
    },
    onSwitchTool: (callback: (route: string) => void) => {
      ipcRenderer.on('shortcut:switch-tool', (_event, route: string) => callback(route))
      return () => ipcRenderer.removeAllListeners('shortcut:switch-tool')
    },
    // Shortcut management API
    getAll: (): Promise<any> => ipcRenderer.invoke('shortcuts:get-all'),
    updateGlobal: (accelerator: string): Promise<boolean> =>
      ipcRenderer.invoke('shortcuts:update-global', accelerator),
    reset: (): Promise<boolean> => ipcRenderer.invoke('shortcuts:reset'),
    validate: (accelerator: string): Promise<{ valid: boolean; conflicts: string[]; warnings: string[] }> =>
      ipcRenderer.invoke('shortcuts:validate', accelerator),
    getRegistered: (): Promise<Array<{ accelerator: string; scope: string; description: string }>> =>
      ipcRenderer.invoke('shortcuts:get-registered')
  },

  // History API
  history: {
    save: (tool: string, input: string, output?: string, metadata?: Record<string, any>): Promise<number> =>
      ipcRenderer.invoke('history:save', tool, input, output, metadata),
    get: (tool?: string, limit?: number): Promise<any[]> =>
      ipcRenderer.invoke('history:get', tool, limit),
    search: (tool: string, query: string, limit?: number): Promise<any[]> =>
      ipcRenderer.invoke('history:search', tool, query, limit),
    getById: (id: number): Promise<any | undefined> =>
      ipcRenderer.invoke('history:get-by-id', id),
    delete: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('history:delete', id),
    toggleFavorite: (id: number): Promise<boolean> =>
      ipcRenderer.invoke('history:toggle-favorite', id),
    clear: (tool: string): Promise<number> =>
      ipcRenderer.invoke('history:clear', tool),
    clearAll: (): Promise<number> =>
      ipcRenderer.invoke('history:clear-all'),
    autoCleanup: (daysOld?: number, keepFavorites?: boolean): Promise<number> =>
      ipcRenderer.invoke('history:auto-cleanup', daysOld, keepFavorites),
    stats: (): Promise<any> =>
      ipcRenderer.invoke('history:stats')
  },

  // Maintenance API
  maintenance: {
    cleanup: (dryRun?: boolean): Promise<number> =>
      ipcRenderer.invoke('maintenance:cleanup', dryRun),
    backup: (): Promise<string> =>
      ipcRenderer.invoke('maintenance:backup'),
    restore: (backupPath: string): Promise<void> =>
      ipcRenderer.invoke('maintenance:restore', backupPath),
    stats: (): Promise<any> =>
      ipcRenderer.invoke('maintenance:stats'),
    listBackups: (): Promise<Array<{ name: string; path: string; size: number; date: Date }>> =>
      ipcRenderer.invoke('maintenance:list-backups')
  },

  // Clipboard API
  clipboard: {
    readText: (): Promise<string> =>
      ipcRenderer.invoke('clipboard:read-text'),
    writeText: (text: string): Promise<boolean> =>
      ipcRenderer.invoke('clipboard:write-text', text),
    clear: (): Promise<boolean> =>
      ipcRenderer.invoke('clipboard:clear')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

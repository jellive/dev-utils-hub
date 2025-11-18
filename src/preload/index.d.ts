interface PlatformInfo {
  platform: NodeJS.Platform
  arch: string
  version: string
  versions: NodeJS.ProcessVersions
}

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>
      getAppVersion: () => Promise<string>
      getPlatformInfo: () => Promise<PlatformInfo>
      settings: {
        get: <T = any>(key: string) => Promise<T>
        set: (key: string, value: any) => Promise<boolean>
        getAll: () => Promise<Record<string, any>>
        reset: () => Promise<boolean>
        delete: (key: string) => Promise<boolean>
      }
      shortcuts: {
        onOpenSettings: (callback: () => void) => () => void
        onToggleHistory: (callback: () => void) => () => void
        onSwitchTool: (callback: (route: string) => void) => () => void
        getAll: () => Promise<any>
        updateGlobal: (accelerator: string) => Promise<boolean>
        reset: () => Promise<boolean>
        validate: (accelerator: string) => Promise<{ valid: boolean; conflicts: string[]; warnings: string[] }>
        getRegistered: () => Promise<Array<{ accelerator: string; scope: string; description: string }>>
      }
      history: {
        save: (tool: string, input: string, output?: string, metadata?: Record<string, any>) => Promise<number>
        get: (tool?: string, limit?: number) => Promise<HistoryEntry[]>
        search: (tool: string, query: string, limit?: number) => Promise<HistoryEntry[]>
        getById: (id: number) => Promise<HistoryEntry | undefined>
        delete: (id: number) => Promise<boolean>
        toggleFavorite: (id: number) => Promise<boolean>
        clear: (tool: string) => Promise<number>
        clearAll: () => Promise<number>
        autoCleanup: (daysOld?: number, keepFavorites?: boolean) => Promise<number>
        stats: () => Promise<HistoryStats>
      }
      maintenance: {
        cleanup: (dryRun?: boolean) => Promise<number>
        backup: () => Promise<string>
        restore: (backupPath: string) => Promise<void>
        stats: () => Promise<MaintenanceStats>
        listBackups: () => Promise<Array<BackupInfo>>
      }
      clipboard: {
        readText: () => Promise<string>
        writeText: (text: string) => Promise<boolean>
        clear: () => Promise<boolean>
      }
      file: {
        save: (content: string, defaultFileName?: string, filters?: FileFilter[]) => Promise<SaveFileResult>
        open: (filters?: FileFilter[]) => Promise<OpenFileResult>
      }
    }
  }
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export enum FileErrorCode {
  CANCELLED = 'CANCELLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_PATH = 'INVALID_PATH',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface FileError {
  code: FileErrorCode
  message: string
  originalError?: Error
}

export interface SaveFileResult {
  success: boolean
  filePath?: string
  error?: FileError
}

export interface OpenFileResult {
  success: boolean
  content?: string
  filePath?: string
  error?: FileError
}

export interface BackupInfo {
  name: string
  path: string
  size: number
  date: Date
}

export interface MaintenanceStats {
  lastCleanup: number | null
  lastBackup: number | null
  recordsDeleted: number
  backupsCreated: number
}

export interface HistoryEntry {
  id?: number
  tool: string
  input: string
  output?: string
  metadata?: string
  favorite?: number
  created_at?: number
}

export interface HistoryStats {
  total: number
  byTool: Record<string, number>
  favorites: number
  oldestEntry: number | null
  newestEntry: number | null
}

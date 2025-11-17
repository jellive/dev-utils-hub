import { ipcMain } from 'electron'
import Store from 'electron-store'

// Settings schema definition
interface SettingsSchema {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'ko'
  autoSaveHistory: boolean
  minimizeToTray: boolean
  launchAtStartup: boolean
  startMinimized: boolean
  // Keyboard shortcuts
  shortcuts: {
    toggleApp: string // Global shortcut for show/hide app
  }
  // App state (from useAppStore)
  'app-state': {
    theme: 'light' | 'dark' | 'system'
    language: 'en' | 'ko'
  }
  // API Tester history
  'api-tester-history': Array<{
    id: string
    timestamp: number
    request: {
      method: string
      url: string
      headers?: Record<string, string>
      body?: string
    }
    response?: {
      status: number
      statusText: string
      headers: Record<string, string>
      body: string
      time: number
    }
  }>
}

// Initialize electron-store with schema and defaults
const settingsStore = new Store<SettingsSchema>({
  name: 'config',
  defaults: {
    theme: 'system',
    language: 'en',
    autoSaveHistory: true,
    minimizeToTray: false,
    launchAtStartup: false,
    startMinimized: false,
    shortcuts: {
      toggleApp: process.platform === 'darwin' ? 'Command+Shift+Space' : 'Control+Space'
    },
    'app-state': {
      theme: 'system',
      language: 'en'
    },
    'api-tester-history': []
  }
})

// Export the settings store for use in other modules
export { settingsStore }

export function setupSettingsHandlers(): void {
  // Get single setting
  ipcMain.handle('settings:get', (_event, key: keyof SettingsSchema) => {
    try {
      return settingsStore.get(key)
    } catch (error) {
      console.error('Failed to get setting:', key, error)
      return null
    }
  })

  // Set single setting
  ipcMain.handle('settings:set', (_event, key: keyof SettingsSchema, value: any) => {
    try {
      settingsStore.set(key, value)
      return true
    } catch (error) {
      console.error('Failed to set setting:', key, error)
      return false
    }
  })

  // Get all settings
  ipcMain.handle('settings:get-all', () => {
    try {
      return settingsStore.store
    } catch (error) {
      console.error('Failed to get all settings:', error)
      return {}
    }
  })

  // Reset settings to defaults
  ipcMain.handle('settings:reset', () => {
    try {
      settingsStore.clear()
      return true
    } catch (error) {
      console.error('Failed to reset settings:', error)
      return false
    }
  })

  // Delete specific setting
  ipcMain.handle('settings:delete', (_event, key: keyof SettingsSchema) => {
    try {
      settingsStore.delete(key)
      return true
    } catch (error) {
      console.error('Failed to delete setting:', key, error)
      return false
    }
  })
}

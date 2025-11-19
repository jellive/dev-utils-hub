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

  // Get all keyboard shortcuts
  ipcMain.handle('shortcuts:get-all', () => {
    try {
      return settingsStore.get('shortcuts')
    } catch (error) {
      console.error('Failed to get shortcuts:', error)
      return null
    }
  })

  // Update global shortcut
  ipcMain.handle('shortcuts:update-global', async (_event, accelerator: string) => {
    try {
      const { updateGlobalShortcut } = await import('../shortcuts')
      const success = updateGlobalShortcut(accelerator)
      return success
    } catch (error) {
      console.error('Failed to update global shortcut:', error)
      return false
    }
  })

  // Reset shortcuts to defaults
  ipcMain.handle('shortcuts:reset', () => {
    try {
      const defaultShortcuts = {
        toggleApp: process.platform === 'darwin' ? 'Command+Shift+Space' : 'Control+Space'
      }
      settingsStore.set('shortcuts', defaultShortcuts)

      // Re-register the global shortcut with default
      import('../shortcuts').then(({ updateGlobalShortcut }) => {
        updateGlobalShortcut(defaultShortcuts.toggleApp)
      })

      return true
    } catch (error) {
      console.error('Failed to reset shortcuts:', error)
      return false
    }
  })

  // Validate shortcut before setting
  ipcMain.handle('shortcuts:validate', async (_event, accelerator: string) => {
    try {
      const { validateShortcut } = await import('../shortcuts')
      return validateShortcut(accelerator)
    } catch (error) {
      console.error('Failed to validate shortcut:', error)
      return {
        valid: false,
        conflicts: ['Validation error'],
        warnings: []
      }
    }
  })

  // Get all registered shortcuts (for display in UI)
  ipcMain.handle('shortcuts:get-registered', async () => {
    try {
      const { getRegisteredShortcuts } = await import('../shortcuts')
      return getRegisteredShortcuts()
    } catch (error) {
      console.error('Failed to get registered shortcuts:', error)
      return []
    }
  })

  // Auto-start functionality
  ipcMain.handle('settings:set-auto-start', async (_event, enabled: boolean, startMinimized: boolean) => {
    try {
      const { app } = await import('electron')

      // Set login item settings
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: startMinimized,
        args: startMinimized ? ['--hidden'] : []
      })

      // Save to store
      settingsStore.set('launchAtStartup', enabled)
      settingsStore.set('startMinimized', startMinimized)

      return true
    } catch (error) {
      console.error('Failed to set auto-start:', error)
      return false
    }
  })

  // Get current auto-start status
  ipcMain.handle('settings:get-auto-start', async () => {
    try {
      const { app } = await import('electron')
      const loginItemSettings = app.getLoginItemSettings()

      return {
        enabled: loginItemSettings.openAtLogin,
        startMinimized: settingsStore.get('startMinimized'),
        wasOpenedAtLogin: loginItemSettings.wasOpenedAtLogin,
        wasOpenedAsHidden: loginItemSettings.wasOpenedAsHidden
      }
    } catch (error) {
      console.error('Failed to get auto-start status:', error)
      return {
        enabled: false,
        startMinimized: false,
        wasOpenedAtLogin: false,
        wasOpenedAsHidden: false
      }
    }
  })
}

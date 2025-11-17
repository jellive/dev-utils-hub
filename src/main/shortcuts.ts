import { BrowserWindow, globalShortcut } from 'electron'
import { toggleWindowVisibility } from './tray'
import { settingsStore } from './ipc/settings'

let mainWindow: BrowserWindow | null = null
let currentShortcut: string | null = null

/**
 * Register global keyboard shortcuts
 * @param window - The main browser window to control
 */
export function registerGlobalShortcuts(window: BrowserWindow): void {
  mainWindow = window

  // Get shortcut from settings
  const shortcuts = settingsStore.get('shortcuts')
  const toggleShortcut = shortcuts?.toggleApp ||
    (process.platform === 'darwin' ? 'Command+Shift+Space' : 'Control+Space')

  const registered = globalShortcut.register(toggleShortcut, () => {
    console.log(`Global shortcut triggered: ${toggleShortcut}`)

    if (mainWindow) {
      toggleWindowVisibility(mainWindow)
    }
  })

  if (registered) {
    currentShortcut = toggleShortcut
    console.log(`✓ Global shortcut registered: ${toggleShortcut}`)
  } else {
    console.error(`✗ Failed to register global shortcut: ${toggleShortcut}`)
    console.error('  This shortcut may already be in use by another application')
  }
}

/**
 * Update the global shortcut with a new accelerator
 * @param accelerator - The new keyboard shortcut (e.g., 'Command+Shift+Space')
 * @returns true if successfully updated, false otherwise
 */
export function updateGlobalShortcut(accelerator: string): boolean {
  // Unregister current shortcut
  if (currentShortcut) {
    globalShortcut.unregister(currentShortcut)
  }

  // Try to register new shortcut
  const registered = globalShortcut.register(accelerator, () => {
    console.log(`Global shortcut triggered: ${accelerator}`)

    if (mainWindow) {
      toggleWindowVisibility(mainWindow)
    }
  })

  if (registered) {
    currentShortcut = accelerator
    // Save to settings
    const shortcuts = settingsStore.get('shortcuts') || { toggleApp: accelerator }
    shortcuts.toggleApp = accelerator
    settingsStore.set('shortcuts', shortcuts)
    console.log(`✓ Global shortcut updated to: ${accelerator}`)
    return true
  } else {
    // Re-register old shortcut if new one failed
    if (currentShortcut) {
      globalShortcut.register(currentShortcut, () => {
        if (mainWindow) {
          toggleWindowVisibility(mainWindow)
        }
      })
    }
    console.error(`✗ Failed to register new shortcut: ${accelerator}`)
    return false
  }
}

/**
 * Unregister all global shortcuts
 */
export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
  console.log('✓ All global shortcuts unregistered')
}

/**
 * Check if a specific shortcut is registered
 * @param accelerator - The shortcut to check (e.g., 'Command+Space')
 */
export function isShortcutRegistered(accelerator: string): boolean {
  return globalShortcut.isRegistered(accelerator)
}

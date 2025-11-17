import { BrowserWindow, globalShortcut } from 'electron'
import { toggleWindowVisibility } from './tray'

let mainWindow: BrowserWindow | null = null

/**
 * Register global keyboard shortcuts
 * @param window - The main browser window to control
 */
export function registerGlobalShortcuts(window: BrowserWindow): void {
  mainWindow = window

  // Register Cmd/Ctrl+Shift+Space for global app show/hide
  // Note: Cmd+Space is reserved for Spotlight on macOS
  const toggleShortcut = process.platform === 'darwin' ? 'Command+Shift+Space' : 'Control+Space'

  const registered = globalShortcut.register(toggleShortcut, () => {
    console.log(`Global shortcut triggered: ${toggleShortcut}`)

    if (mainWindow) {
      toggleWindowVisibility(mainWindow)
    }
  })

  if (registered) {
    console.log(`✓ Global shortcut registered: ${toggleShortcut}`)
  } else {
    console.error(`✗ Failed to register global shortcut: ${toggleShortcut}`)
    console.error('  This shortcut may already be in use by another application')
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

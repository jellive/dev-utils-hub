import { BrowserWindow, globalShortcut } from 'electron'
import electronLocalShortcut from 'electron-localshortcut'
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

/**
 * Register window-specific shortcuts
 * @param window - The main browser window to register shortcuts for
 */
export function registerWindowShortcuts(window: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  // Settings shortcut (Command/Ctrl + ,)
  electronLocalShortcut.register(window, isMac ? 'Command+,' : 'Ctrl+,', () => {
    console.log('Settings shortcut triggered')
    window.webContents.send('shortcut:open-settings')
  })

  // Toggle history panel (Command/Ctrl + H)
  electronLocalShortcut.register(window, isMac ? 'Command+H' : 'Ctrl+H', () => {
    console.log('Toggle history shortcut triggered')
    window.webContents.send('shortcut:toggle-history')
  })

  // Minimize window (Command/Ctrl + M)
  electronLocalShortcut.register(window, isMac ? 'Command+M' : 'Ctrl+M', () => {
    console.log('Minimize window shortcut triggered')
    window.minimize()
  })

  // Close/Hide window (Command/Ctrl + W)
  electronLocalShortcut.register(window, isMac ? 'Command+W' : 'Ctrl+W', () => {
    console.log('Close/Hide window shortcut triggered')
    window.hide()
  })

  // Fullscreen toggle (Command/Ctrl + F)
  electronLocalShortcut.register(window, isMac ? 'Command+F' : 'F11', () => {
    console.log('Fullscreen toggle shortcut triggered')
    window.setFullScreen(!window.isFullScreen())
  })

  // Tool switching shortcuts (Command/Ctrl + 1-9)
  const toolRoutes = [
    '/', // Command+1: Home
    '/json', // Command+2: JSON Formatter
    '/jwt', // Command+3: JWT Decoder
    '/base64', // Command+4: Base64 Converter
    '/url', // Command+5: URL Converter
    '/regex', // Command+6: Regex Tester
    '/diff', // Command+7: Text Diff
    '/hash', // Command+8: Hash Generator
    '/uuid' // Command+9: UUID Generator
  ]

  toolRoutes.forEach((route, index) => {
    const number = index + 1
    if (number <= 9) {
      electronLocalShortcut.register(window, isMac ? `Command+${number}` : `Ctrl+${number}`, () => {
        console.log(`Tool switch shortcut triggered: ${number} -> ${route}`)
        window.webContents.send('shortcut:switch-tool', route)
      })
    }
  })

  console.log('✓ Window-specific shortcuts registered')
}

/**
 * Unregister window-specific shortcuts
 * @param window - The window to unregister shortcuts from
 */
export function unregisterWindowShortcuts(window: BrowserWindow): void {
  electronLocalShortcut.unregisterAll(window)
  console.log('✓ Window-specific shortcuts unregistered')
}

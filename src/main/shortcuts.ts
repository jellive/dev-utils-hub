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
    trackShortcut(toggleShortcut, 'global', 'Toggle app visibility')
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
  // Validate new shortcut first
  const validation = validateShortcut(accelerator)
  if (!validation.valid) {
    console.error(`✗ Invalid shortcut: ${accelerator}`)
    console.error(`  Conflicts: ${validation.conflicts.join(', ')}`)
    return false
  }

  // Show warnings if any
  if (validation.warnings.length > 0) {
    console.warn(`⚠️  Warnings for ${accelerator}:`)
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  // Unregister current shortcut
  if (currentShortcut) {
    globalShortcut.unregister(currentShortcut)
    untrackShortcut(currentShortcut)
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
    trackShortcut(accelerator, 'global', 'Toggle app visibility')
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
      trackShortcut(currentShortcut, 'global', 'Toggle app visibility')
    }
    console.error(`✗ Failed to register new shortcut: ${accelerator}`)
    return false
  }
}

/**
 * Unregister all global shortcuts
 */
export function unregisterGlobalShortcuts(): void {
  if (currentShortcut) {
    untrackShortcut(currentShortcut)
  }
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
  const settingsShortcut = isMac ? 'Command+,' : 'Ctrl+,'
  electronLocalShortcut.register(window, settingsShortcut, () => {
    console.log('Settings shortcut triggered')
    window.webContents.send('shortcut:open-settings')
  })
  trackShortcut(settingsShortcut, 'window', 'Open settings')

  // Toggle history panel (Command/Ctrl + H)
  const historyShortcut = isMac ? 'Command+H' : 'Ctrl+H'
  electronLocalShortcut.register(window, historyShortcut, () => {
    console.log('Toggle history shortcut triggered')
    window.webContents.send('shortcut:toggle-history')
  })
  trackShortcut(historyShortcut, 'window', 'Toggle history panel')

  // Minimize window (Command/Ctrl + M)
  const minimizeShortcut = isMac ? 'Command+M' : 'Ctrl+M'
  electronLocalShortcut.register(window, minimizeShortcut, () => {
    console.log('Minimize window shortcut triggered')
    window.minimize()
  })
  trackShortcut(minimizeShortcut, 'window', 'Minimize window')

  // Close/Hide window (Command/Ctrl + W)
  const closeShortcut = isMac ? 'Command+W' : 'Ctrl+W'
  electronLocalShortcut.register(window, closeShortcut, () => {
    console.log('Close/Hide window shortcut triggered')
    window.hide()
  })
  trackShortcut(closeShortcut, 'window', 'Close/Hide window')

  // Fullscreen toggle (Command/Ctrl + F)
  const fullscreenShortcut = isMac ? 'Command+F' : 'F11'
  electronLocalShortcut.register(window, fullscreenShortcut, () => {
    console.log('Fullscreen toggle shortcut triggered')
    window.setFullScreen(!window.isFullScreen())
  })
  trackShortcut(fullscreenShortcut, 'window', 'Toggle fullscreen')

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
      const toolShortcut = isMac ? `Command+${number}` : `Ctrl+${number}`
      electronLocalShortcut.register(window, toolShortcut, () => {
        console.log(`Tool switch shortcut triggered: ${number} -> ${route}`)
        window.webContents.send('shortcut:switch-tool', route)
      })
      trackShortcut(toolShortcut, 'window', `Switch to tool ${number}`)
    }
  })

  console.log('✓ Window-specific shortcuts registered')
}

/**
 * Unregister window-specific shortcuts
 * @param window - The window to unregister shortcuts from
 */
export function unregisterWindowShortcuts(window: BrowserWindow): void {
  // Clear all window-specific shortcuts from tracking
  const windowShortcuts = Array.from(registeredShortcuts.entries())
    .filter(([_, info]) => info.scope === 'window')
    .map(([accelerator]) => accelerator)

  windowShortcuts.forEach(accelerator => untrackShortcut(accelerator))

  // Safely unregister shortcuts - window might already be destroyed
  try {
    electronLocalShortcut.unregisterAll(window)
    console.log('✓ Window-specific shortcuts unregistered')
  } catch (error) {
    // Window already destroyed - silently ignore
    if ((error as any).message?.includes('destroyed')) {
      console.log('✓ Window-specific shortcuts cleaned up (window already destroyed)')
    } else {
      console.error('Error unregistering window shortcuts:', error)
    }
  }
}

/**
 * Check and log all shortcut conflicts on startup
 */
export function checkAndLogConflicts(): void {
  const conflictReport = checkShortcutConflicts()

  if (conflictReport.hasConflicts) {
    console.error('⚠️  Shortcut conflicts detected:')
    conflictReport.conflicts.forEach(({ shortcut, issue }) => {
      console.error(`  - ${shortcut}: ${issue}`)
    })
  } else {
    console.log('✓ No shortcut conflicts detected')
  }

  // Log all registered shortcuts
  const shortcuts = getRegisteredShortcuts()
  console.log('\n📋 Registered shortcuts:')
  shortcuts.forEach(({ accelerator, scope, description }) => {
    console.log(`  [${scope}] ${accelerator}: ${description}`)
  })
}

// Shortcut conflict detection and validation

/**
 * System reserved shortcuts that should not be used
 */
const SYSTEM_RESERVED_SHORTCUTS: Record<string, string[]> = {
  darwin: [
    'Command+Space', // Spotlight
    'Command+Tab', // App switcher
    'Command+Q', // Quit app
    'Command+Option+Esc', // Force quit
    'Command+Shift+3', // Screenshot
    'Command+Shift+4', // Screenshot (region)
    'Command+Shift+5', // Screenshot options
    'Command+Control+Q', // Lock screen
    'Command+Control+Space', // Emoji picker
    'Command+H', // Hide app (macOS system shortcut)
  ],
  win32: [
    'Control+Escape', // Start menu
    'Alt+Tab', // App switcher
    'Alt+F4', // Close window
    'Windows+L', // Lock screen
    'Windows+D', // Show desktop
    'PrintScreen', // Screenshot
  ],
  linux: [
    'Alt+Tab', // App switcher
    'Control+Alt+Delete', // System monitor
    'Alt+F4', // Close window
    'PrintScreen', // Screenshot
  ]
}

/**
 * Application shortcuts that are currently registered
 */
interface RegisteredShortcut {
  accelerator: string
  scope: 'global' | 'window'
  description: string
}

const registeredShortcuts: Map<string, RegisteredShortcut> = new Map()

/**
 * Register a shortcut for conflict tracking
 */
function trackShortcut(accelerator: string, scope: 'global' | 'window', description: string): void {
  registeredShortcuts.set(accelerator, { accelerator, scope, description })
}

/**
 * Untrack a shortcut
 */
function untrackShortcut(accelerator: string): void {
  registeredShortcuts.delete(accelerator)
}

/**
 * Validate if a shortcut is safe to use
 * @param accelerator - The keyboard shortcut to validate
 * @returns Validation result with conflicts if any
 */
export function validateShortcut(accelerator: string): {
  valid: boolean
  conflicts: string[]
  warnings: string[]
} {
  const conflicts: string[] = []
  const warnings: string[] = []

  // Check if shortcut is system reserved
  const systemShortcuts = SYSTEM_RESERVED_SHORTCUTS[process.platform] || []
  if (systemShortcuts.includes(accelerator)) {
    conflicts.push(`System reserved shortcut: ${accelerator}`)
  }

  // Check if shortcut is already registered in our app
  const existing = registeredShortcuts.get(accelerator)
  if (existing) {
    conflicts.push(`Already registered as '${existing.description}' (${existing.scope})`)
  }

  // Check if shortcut is already registered globally
  if (globalShortcut.isRegistered(accelerator)) {
    warnings.push(`Already registered globally (possibly by another application)`)
  }

  // Validate shortcut format
  if (!isValidAccelerator(accelerator)) {
    conflicts.push(`Invalid shortcut format: ${accelerator}`)
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings
  }
}

/**
 * Validate accelerator format
 */
function isValidAccelerator(accelerator: string): boolean {
  // Basic validation - check for valid modifiers and key
  const validModifiers = ['Command', 'Cmd', 'Control', 'Ctrl', 'Alt', 'Option', 'Shift', 'Super', 'Meta']
  const parts = accelerator.split('+')

  if (parts.length === 0) return false

  // Last part should be the key
  const key = parts[parts.length - 1]
  if (!key || key.length === 0) return false

  // Check modifiers
  const modifiers = parts.slice(0, -1)
  for (const modifier of modifiers) {
    if (!validModifiers.includes(modifier)) {
      return false
    }
  }

  return true
}

/**
 * Get all registered shortcuts
 */
export function getRegisteredShortcuts(): RegisteredShortcut[] {
  return Array.from(registeredShortcuts.values())
}

/**
 * Check for conflicts between shortcuts
 */
export function checkShortcutConflicts(): {
  hasConflicts: boolean
  conflicts: Array<{ shortcut: string; issue: string }>
} {
  const conflicts: Array<{ shortcut: string; issue: string }> = []

  // Check all registered shortcuts for system conflicts
  for (const [accelerator] of registeredShortcuts) {
    const validation = validateShortcut(accelerator)
    if (!validation.valid) {
      conflicts.push({
        shortcut: accelerator,
        issue: validation.conflicts.join(', ')
      })
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  }
}

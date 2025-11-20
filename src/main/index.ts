import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { setupSettingsHandlers } from './ipc/settings'
import { setupHistoryHandlers } from './ipc/history'
import { setupClipboardHandlers } from './ipc/clipboard'
import { setupFileHandlers } from './ipc/file'
import { createApplicationMenu } from './menu'
import { createTray, handleWindowClose, destroyTray } from './tray'
import {
  registerGlobalShortcuts,
  registerWindowShortcuts,
  unregisterGlobalShortcuts,
  unregisterWindowShortcuts,
  checkAndLogConflicts
} from './shortcuts'
import { initializeDatabase, closeDatabase } from './db'
import { initializeMaintenance, stopMaintenance } from './db/maintenance'
import { initializeUpdater, stopUpdater } from './updater'

// Initialize electron-store for persistent settings
const store = new Store()

// Global flag to prevent minimize-to-tray on quit
;(app as any).isQuitting = false

// Handle EPIPE errors from console.log when stdout is closed
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Ignore EPIPE errors - they happen when stdout is closed
    return
  }
  // Cannot use console.error here as it might also throw EPIPE
})

process.stderr.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Ignore EPIPE errors - they happen when stderr is closed
    return
  }
  // Cannot use console.error here as it might also throw EPIPE
})

// Override console methods to handle EPIPE errors gracefully
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn
const originalInfo = console.info

function safeConsole(original: Function, ...args: any[]): void {
  try {
    original(...args)
  } catch (error: any) {
    // Silently ignore EPIPE errors
    if (error?.code !== 'EPIPE') {
      // For other errors, try to write to stderr directly
      try {
        process.stderr.write(`Console error: ${error}\n`)
      } catch {
        // Completely ignore if even stderr fails
      }
    }
  }
}

console.log = (...args: any[]) => safeConsole(originalLog, ...args)
console.error = (...args: any[]) => safeConsole(originalError, ...args)
console.warn = (...args: any[]) => safeConsole(originalWarn, ...args)
console.info = (...args: any[]) => safeConsole(originalInfo, ...args)

// IPC Handlers
function setupIpcHandlers(): void {
  // Test ping handler
  ipcMain.handle('ping', () => {
    return 'pong'
  })

  // Get application version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Get platform information
  ipcMain.handle('platform-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      versions: process.versions
    }
  })

  // Setup settings handlers
  setupSettingsHandlers()

  // Setup history handlers
  setupHistoryHandlers()

  // Setup clipboard handlers
  setupClipboardHandlers()

  // Setup file handlers
  setupFileHandlers()
}

let mainWindow: BrowserWindow | null = null

interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

function getWindowBounds(): WindowBounds {
  const defaultBounds = { width: 1200, height: 800 }
  const savedBounds = store.get('windowBounds') as WindowBounds | undefined

  if (savedBounds) {
    return {
      ...defaultBounds,
      ...savedBounds
    }
  }

  return defaultBounds
}

function saveWindowBounds(): void {
  if (!mainWindow) return

  const bounds = mainWindow.getBounds()
  store.set('windowBounds', bounds)
}

function createWindow(): void {
  const bounds = getWindowBounds()

  // Create the browser window
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    // Check if app was launched with --hidden flag (auto-start minimized)
    const shouldStartHidden = process.argv.includes('--hidden')

    if (!shouldStartHidden) {
      mainWindow?.show()
    }

    // Create application menu
    if (mainWindow) {
      createApplicationMenu(mainWindow)
    }

    // Create system tray
    if (mainWindow) {
      createTray(mainWindow)
    }

    // Register global shortcuts
    if (mainWindow) {
      registerGlobalShortcuts(mainWindow)
      registerWindowShortcuts(mainWindow)

      // Check and log any shortcut conflicts
      checkAndLogConflicts()
    }

    // Initialize auto-updater
    if (mainWindow) {
      initializeUpdater(mainWindow)
    }

    // Open DevTools in development
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  // Save window bounds on resize/move
  mainWindow.on('resize', saveWindowBounds)
  mainWindow.on('move', saveWindowBounds)

  // Handle window close - minimize to tray instead of quit
  mainWindow.on('close', (event) => {
    if (mainWindow) {
      handleWindowClose(mainWindow, event)
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    if (mainWindow) {
      unregisterWindowShortcuts(mainWindow)
    }
    mainWindow = null
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli
  // Load the remote URL for development or the local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// App lifecycle events
app.whenReady().then(() => {
  // Set app name (affects menu bar and process list)
  app.setName('Dev Utils Hub')

  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.devutils.hub')
  }

  // Initialize database
  initializeDatabase()

  // Initialize maintenance system
  initializeMaintenance()

  // Setup IPC handlers
  setupIpcHandlers()

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Set quitting flag before quit
app.on('before-quit', () => {
  ;(app as any).isQuitting = true
  if (mainWindow) {
    saveWindowBounds()
  }
  destroyTray()
  unregisterGlobalShortcuts()
  stopUpdater()
  stopMaintenance()
  closeDatabase()
})

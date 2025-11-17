import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { setupSettingsHandlers } from './ipc/settings'
import { createApplicationMenu } from './menu'

// Initialize electron-store for persistent settings
const store = new Store()

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
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  // Show window when ready
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()

    // Create application menu
    if (mainWindow) {
      createApplicationMenu(mainWindow)
    }

    // Open DevTools in development
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  // Save window bounds on resize/move
  mainWindow.on('resize', saveWindowBounds)
  mainWindow.on('move', saveWindowBounds)

  // Handle window close
  mainWindow.on('closed', () => {
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
  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.devutils.hub')
  }

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

// Cleanup before quit
app.on('before-quit', () => {
  if (mainWindow) {
    saveWindowBounds()
  }
})

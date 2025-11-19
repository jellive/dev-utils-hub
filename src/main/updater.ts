import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog } from 'electron'
import { settingsStore } from './ipc/settings'

// Configure auto-updater
autoUpdater.autoDownload = false // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true // Install on quit by default

let updateCheckInterval: NodeJS.Timeout | null = null

/**
 * Initialize auto-updater
 */
export function initializeUpdater(mainWindow: BrowserWindow): void {
  // Skip in development
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Auto-updater disabled in development mode')
    return
  }

  console.log('🔄 Initializing auto-updater...')

  // Set up event handlers
  setupUpdateEventHandlers(mainWindow)

  // Check for updates on startup (after 10 seconds delay)
  setTimeout(() => {
    checkForUpdates()
  }, 10000)

  // Check for updates periodically (every 1 hour)
  updateCheckInterval = setInterval(
    () => {
      checkForUpdates()
    },
    60 * 60 * 1000
  ) // 1 hour

  console.log('✓ Auto-updater initialized')
}

/**
 * Stop auto-updater (cleanup)
 */
export function stopUpdater(): void {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval)
    updateCheckInterval = null
  }
  console.log('✓ Auto-updater stopped')
}

/**
 * Manually check for updates
 */
export async function checkForUpdates(): Promise<void> {
  try {
    console.log('🔍 Checking for updates...')
    await autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('❌ Failed to check for updates:', error)
  }
}

/**
 * Download update
 */
export async function downloadUpdate(): Promise<void> {
  try {
    console.log('⬇️  Downloading update...')
    await autoUpdater.downloadUpdate()
  } catch (error) {
    console.error('❌ Failed to download update:', error)
  }
}

/**
 * Install update and restart
 */
export function quitAndInstall(): void {
  try {
    console.log('🔄 Installing update and restarting...')
    autoUpdater.quitAndInstall(false, true)
  } catch (error) {
    console.error('❌ Failed to install update:', error)
  }
}

/**
 * Set up update event handlers
 */
function setupUpdateEventHandlers(mainWindow: BrowserWindow): void {
  // Checking for update
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Checking for updates...')
  })

  // Update available
  autoUpdater.on('update-available', (info) => {
    console.log('✨ Update available:', info.version)

    // Send event to renderer
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    })
  })

  // Update not available
  autoUpdater.on('update-not-available', (info) => {
    console.log('✓ App is up to date:', info.version)
  })

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    console.log(
      `⬇️  Download progress: ${progress.percent.toFixed(2)}% (${progress.transferred}/${progress.total})`
    )

    // Send progress to renderer
    mainWindow.webContents.send('download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('✓ Update downloaded:', info.version)

    // Send event to renderer
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    })

    // Show dialog
    const autoInstall = settingsStore.get('autoInstallUpdates') ?? true

    if (autoInstall) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: `Version ${info.version} has been downloaded.`,
          detail: 'The update will be installed when you quit the app.',
          buttons: ['Install Now', 'Later']
        })
        .then((result) => {
          if (result.response === 0) {
            quitAndInstall()
          }
        })
    }
  })

  // Error
  autoUpdater.on('error', (error) => {
    console.error('❌ Auto-updater error:', error)

    // Send error to renderer
    mainWindow.webContents.send('update-error', {
      message: error.message
    })
  })
}

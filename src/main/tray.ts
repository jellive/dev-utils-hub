import { app, Tray, Menu, BrowserWindow, nativeImage } from 'electron'

let tray: Tray | null = null
let isTogglingWindow = false

export function createTray(mainWindow: BrowserWindow): Tray {
  // Try to use emoji as tray icon (most reliable for dev mode)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEAAQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgAAAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAADQqZSKAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cnwsf+gAAAH4SURBVFgJ7ZbNSsNAFIWbpDZa/Kki6E4f4BXuXLhz5wv4Bi51o4I7F76AKxduBFdufABxIYIgIlatrW1+nDNJpmkTk0yTblyUZOCbO3PnZM7NvZMJpOu6aFnWEsQEwQRBCmLEEPtIQQqiRBH7iCEO0bIsQTCRCAqCVxAbhDiEOERMEGQgRgyxjxSkIEoUsY8Y4hCxQRBMJIKC4BXEBiEOIQ4RE4QZiDFD7CMFKYgSQ+wjhjhEbBAEE4mgIHgFsUGIQ4hDxARhBmLMEPtIQQqixBD7iCEOERsEwUQiKAheQWwQ4hDiEDFBmIEYM8Q+UpCCKDHEPmKIQ8QGQTCRCAqCVxAbhDiEOERMEGYgxgyxjxSkIEoMsY8Y4hCxQRBMJIKC4BXEBiEOIQ4RE4QZiDFD7CMFKYgSQ+wjhjhEbBAEE4mgIHgFsUGIQ4hDxARhBmLMEPtIQQqixBD7iCEOERsEwUQiKAheQWwQ4hDiEDFB8BVgL0K/CzGN+J/IUhAnivga8e9ChASBroI/EPuIIQ7RswQTEYmgIHgFsUGIQ8QEYQZizBD7SEEK'
  )

  // Create tray with emoji icon
  tray = new Tray(icon)
  console.log('✓ System tray created successfully')

  // Set title (visible text in menu bar - macOS only)
  if (process.platform === 'darwin') {
    tray.setTitle('DU')
    console.log('✓ Tray title set to: DU')
  }

  // Set tooltip
  tray.setToolTip('Dev Utils Hub')
  console.log('✓ Tray tooltip set to: Dev Utils Hub')

  // Important: Ignore double click events for reliable single clicks
  tray.setIgnoreDoubleClickEvents(true)

  // Function to update context menu with current window state
  const updateContextMenu = () => {
    const isVisible = mainWindow.isVisible() && !mainWindow.isMinimized()

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        type: 'checkbox',
        checked: isVisible,
        click: () => {
          console.log('Menu: Show App clicked')

          // Prevent rapid toggling
          if (isTogglingWindow) {
            console.log('Already toggling, ignoring menu click')
            return
          }

          toggleWindowVisibility(mainWindow)
        }
      },
      {
        label: 'Settings',
        enabled: false, // Placeholder for future
        click: () => {
          // Future: Open settings
        }
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        enabled: false, // Placeholder for future
        click: () => {
          // Future: Check for updates
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          // Force quit by setting a flag to prevent minimize-to-tray
          ;(app as any).isQuitting = true
          app.quit()
        }
      }
    ])

    if (tray) {
      tray.setContextMenu(contextMenu)
    }
  }

  // Set initial context menu
  updateContextMenu()

  // Update menu when window visibility changes
  mainWindow.on('show', updateContextMenu)
  mainWindow.on('hide', updateContextMenu)
  mainWindow.on('minimize', updateContextMenu)
  mainWindow.on('restore', updateContextMenu)

  return tray
}

export function toggleWindowVisibility(window: BrowserWindow): void {
  isTogglingWindow = true

  // Check if window is visible AND not minimized
  if (window.isVisible() && !window.isMinimized()) {
    console.log('Hiding window to tray')
    window.hide()
    if (process.platform === 'darwin') {
      app.dock.hide()
    }

    // Reset flag after a short delay
    setTimeout(() => {
      isTogglingWindow = false
    }, 300)
  } else {
    console.log('Showing window from tray')
    showWindow(window)

    // Reset flag after showing is complete
    setTimeout(() => {
      isTogglingWindow = false
    }, 500)
  }
}

function showWindow(window: BrowserWindow): void {
  // Show dock first on macOS
  if (process.platform === 'darwin') {
    app.dock.show()
  }

  // Show and restore window if minimized
  if (window.isMinimized()) {
    window.restore()
  }

  window.show()
  window.focus()

  // On macOS, ensure the app is brought to front
  if (process.platform === 'darwin') {
    app.focus({ steal: true })
  }
}

export function handleWindowClose(window: BrowserWindow, event: Electron.Event): boolean {
  // Get minimize-to-tray setting from store
  // For now, always minimize to tray if tray exists
  if (tray && !(app as any).isQuitting) {
    event.preventDefault()
    window.hide()

    // Hide dock icon on macOS when window hidden
    if (process.platform === 'darwin') {
      app.dock.hide()
    }

    return false
  }

  return true
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

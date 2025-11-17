import { app, Menu, shell, BrowserWindow, dialog } from 'electron'

export function createApplicationMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS App menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                label: `About ${app.name}`,
                click: () => showAboutDialog(mainWindow)
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),

    // File menu
    {
      label: 'File',
      submenu: [
        isMac
          ? { role: 'close' as const }
          : {
              label: 'Quit',
              accelerator: 'Ctrl+Q',
              click: () => {
                app.quit()
              }
            }
      ]
    },

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const }
            ]
          : [{ role: 'delete' as const }, { type: 'separator' as const }, { role: 'selectAll' as const }])
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',
          click: () => {
            mainWindow.reload()
          }
        },
        {
          label: 'Force Reload',
          accelerator: isMac ? 'Cmd+Shift+R' : 'Ctrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const }
            ]
          : [{ role: 'close' as const }])
      ]
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/electron/electron')
          }
        },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/dev-utils-hub')
          }
        },
        { type: 'separator' as const },
        {
          label: 'Check for Updates',
          click: () => {
            // Placeholder for auto-updater
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Check for Updates',
              message: 'You are running the latest version!',
              detail: `Version ${app.getVersion()}`,
              buttons: ['OK']
            })
          }
        },
        ...(isMac
          ? []
          : [
              { type: 'separator' as const },
              {
                label: `About ${app.name}`,
                click: () => showAboutDialog(mainWindow)
              }
            ])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function showAboutDialog(window: BrowserWindow): void {
  dialog.showMessageBox(window, {
    type: 'info',
    title: `About ${app.name}`,
    message: app.name,
    detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}\nV8: ${process.versions.v8}\n\nA collection of developer utility tools.`,
    buttons: ['OK']
  })
}

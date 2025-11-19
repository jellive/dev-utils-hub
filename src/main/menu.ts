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
              {
                label: 'Preferences...',
                accelerator: 'Cmd+,',
                click: () => {
                  mainWindow.webContents.send('navigate-to', '/settings')
                }
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
        {
          label: 'Export History...',
          accelerator: isMac ? 'Cmd+E' : 'Ctrl+E',
          click: () => {
            mainWindow.webContents.send('trigger-export')
          }
        },
        {
          label: 'Import History...',
          accelerator: isMac ? 'Cmd+I' : 'Ctrl+I',
          click: () => {
            mainWindow.webContents.send('trigger-import')
          }
        },
        { type: 'separator' as const },
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

    // Tools menu
    {
      label: 'Tools',
      submenu: [
        {
          label: 'JSON Formatter',
          accelerator: isMac ? 'Cmd+1' : 'Ctrl+1',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/json')
          }
        },
        {
          label: 'JWT Decoder',
          accelerator: isMac ? 'Cmd+2' : 'Ctrl+2',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/jwt')
          }
        },
        {
          label: 'Base64 Converter',
          accelerator: isMac ? 'Cmd+3' : 'Ctrl+3',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/base64')
          }
        },
        {
          label: 'URL Encoder/Decoder',
          accelerator: isMac ? 'Cmd+4' : 'Ctrl+4',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/url')
          }
        },
        {
          label: 'Regex Tester',
          accelerator: isMac ? 'Cmd+5' : 'Ctrl+5',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/regex')
          }
        },
        {
          label: 'Text Diff',
          accelerator: isMac ? 'Cmd+6' : 'Ctrl+6',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/diff')
          }
        },
        {
          label: 'Hash Generator',
          accelerator: isMac ? 'Cmd+7' : 'Ctrl+7',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/hash')
          }
        },
        {
          label: 'UUID Generator',
          accelerator: isMac ? 'Cmd+8' : 'Ctrl+8',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/uuid')
          }
        },
        {
          label: 'Timestamp Converter',
          accelerator: isMac ? 'Cmd+9' : 'Ctrl+9',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/timestamp')
          }
        },
        { type: 'separator' as const },
        {
          label: 'All Tools...',
          accelerator: isMac ? 'Cmd+0' : 'Ctrl+0',
          click: () => {
            mainWindow.webContents.send('navigate-to-tool', '/')
          }
        }
      ]
    },

    // View menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle History Panel',
          accelerator: isMac ? 'Cmd+Shift+H' : 'Ctrl+Shift+H',
          click: () => {
            mainWindow.webContents.send('toggle-history-panel')
          }
        },
        { type: 'separator' as const },
        {
          label: 'Reload',
          accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',
          click: () => {
            mainWindow.reload()
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
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/dev-utils-hub/wiki')
          }
        },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/dev-utils-hub')
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/dev-utils-hub/issues/new')
          }
        },
        { type: 'separator' as const },
        {
          label: 'Check for Updates',
          enabled: false, // 향후 구현
          click: () => {
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

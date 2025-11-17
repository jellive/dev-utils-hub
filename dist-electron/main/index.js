import { app, ipcMain, shell, dialog, Menu, nativeImage, Tray, BrowserWindow } from "electron";
import { join } from "path";
import Store from "electron-store";
import "fs";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const is = {
  dev: !app.isPackaged
};
({
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
});
const settingsStore = new Store({
  name: "config",
  defaults: {
    theme: "system",
    language: "en",
    autoSaveHistory: true,
    minimizeToTray: false,
    launchAtStartup: false,
    startMinimized: false,
    "app-state": {
      theme: "system",
      language: "en"
    },
    "api-tester-history": []
  }
});
function setupSettingsHandlers() {
  ipcMain.handle("settings:get", (_event, key) => {
    try {
      return settingsStore.get(key);
    } catch (error) {
      console.error("Failed to get setting:", key, error);
      return null;
    }
  });
  ipcMain.handle("settings:set", (_event, key, value) => {
    try {
      settingsStore.set(key, value);
      return true;
    } catch (error) {
      console.error("Failed to set setting:", key, error);
      return false;
    }
  });
  ipcMain.handle("settings:get-all", () => {
    try {
      return settingsStore.store;
    } catch (error) {
      console.error("Failed to get all settings:", error);
      return {};
    }
  });
  ipcMain.handle("settings:reset", () => {
    try {
      settingsStore.clear();
      return true;
    } catch (error) {
      console.error("Failed to reset settings:", error);
      return false;
    }
  });
  ipcMain.handle("settings:delete", (_event, key) => {
    try {
      settingsStore.delete(key);
      return true;
    } catch (error) {
      console.error("Failed to delete setting:", key, error);
      return false;
    }
  });
}
function createApplicationMenu(mainWindow2) {
  const isMac = process.platform === "darwin";
  const template = [
    // macOS App menu
    ...isMac ? [
      {
        label: app.name,
        submenu: [
          {
            label: `About ${app.name}`,
            click: () => showAboutDialog(mainWindow2)
          },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" }
        ]
      }
    ] : [],
    // File menu
    {
      label: "File",
      submenu: [
        isMac ? { role: "close" } : {
          label: "Quit",
          accelerator: "Ctrl+Q",
          click: () => {
            app.quit();
          }
        }
      ]
    },
    // Edit menu
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...isMac ? [
          { role: "pasteAndMatchStyle" },
          { role: "delete" },
          { role: "selectAll" }
        ] : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]
      ]
    },
    // View menu
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: isMac ? "Cmd+R" : "Ctrl+R",
          click: () => {
            mainWindow2.reload();
          }
        },
        {
          label: "Force Reload",
          accelerator: isMac ? "Cmd+Shift+R" : "Ctrl+Shift+R",
          click: () => {
            mainWindow2.webContents.reloadIgnoringCache();
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: isMac ? "Cmd+Option+I" : "Ctrl+Shift+I",
          click: () => {
            mainWindow2.webContents.toggleDevTools();
          }
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    // Window menu
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...isMac ? [
          { type: "separator" },
          { role: "front" },
          { type: "separator" },
          { role: "window" }
        ] : [{ role: "close" }]
      ]
    },
    // Help menu
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            await shell.openExternal("https://github.com/electron/electron");
          }
        },
        {
          label: "GitHub Repository",
          click: async () => {
            await shell.openExternal("https://github.com/yourusername/dev-utils-hub");
          }
        },
        { type: "separator" },
        {
          label: "Check for Updates",
          click: () => {
            dialog.showMessageBox(mainWindow2, {
              type: "info",
              title: "Check for Updates",
              message: "You are running the latest version!",
              detail: `Version ${app.getVersion()}`,
              buttons: ["OK"]
            });
          }
        },
        ...isMac ? [] : [
          { type: "separator" },
          {
            label: `About ${app.name}`,
            click: () => showAboutDialog(mainWindow2)
          }
        ]
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
function showAboutDialog(window) {
  dialog.showMessageBox(window, {
    type: "info",
    title: `About ${app.name}`,
    message: app.name,
    detail: `Version: ${app.getVersion()}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node.js: ${process.versions.node}
V8: ${process.versions.v8}

A collection of developer utility tools.`,
    buttons: ["OK"]
  });
}
let tray = null;
let isTogglingWindow = false;
function createTray(mainWindow2) {
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEAAQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgAAAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAADQqZSKAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cnwsf+gAAAH4SURBVFgJ7ZbNSsNAFIWbpDZa/Kki6E4f4BXuXLhz5wv4Bi51o4I7F76AKxduBFdufABxIYIgIlatrW1+nDNJpmkTk0yTblyUZOCbO3PnZM7NvZMJpOu6aFnWEsQEwQRBCmLEEPtIQQqiRBH7iCEO0bIsQTCRCAqCVxAbhDiEOERMEGQgRgyxjxSkIEoUsY8Y4hCxQRBMJIKC4BXEBiEOIQ4RE4QZiDFD7CMFKYgSQ+wjhjhEbBAEE4mgIHgFsUGIQ4hDxARhBmLMEPtIQQqixBD7iCEOERsEwUQiKAheQWwQ4hDiEDFBmIEYM8Q+UpCCKDHEPmKIQ8QGQTCRCAqCVxAbhDiEOERMEGYgxgyxjxSkIEoMsY8Y4hCxQRBMJIKC4BXEBiEOIQ4RE4QZiDFD7CMFKYgSQ+wjhjhEbBAEE4mgIHgFsUGIQ4hDxARhBmLMEPtIQQqixBD7iCEOERsEwUQiKAheQWwQ4hDiEDFB8BVgL0K/CzGN+J/IUhAnivga8e9ChASBroI/EPuIIQ7RswQTEYmgIHgFsUGIQ8QEYQZizBD7SEEK"
  );
  tray = new Tray(icon);
  console.log("✓ System tray created successfully");
  if (process.platform === "darwin") {
    tray.setTitle("DU");
    console.log("✓ Tray title set to: DU");
  }
  tray.setToolTip("Dev Utils Hub");
  console.log("✓ Tray tooltip set to: Dev Utils Hub");
  tray.setIgnoreDoubleClickEvents(true);
  const updateContextMenu = () => {
    const isVisible = mainWindow2.isVisible() && !mainWindow2.isMinimized();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show App",
        type: "checkbox",
        checked: isVisible,
        click: () => {
          console.log("Menu: Show App clicked");
          if (isTogglingWindow) {
            console.log("Already toggling, ignoring menu click");
            return;
          }
          toggleWindowVisibility(mainWindow2);
        }
      },
      {
        label: "Settings",
        enabled: false,
        // Placeholder for future
        click: () => {
        }
      },
      { type: "separator" },
      {
        label: "Check for Updates",
        enabled: false,
        // Placeholder for future
        click: () => {
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  };
  updateContextMenu();
  mainWindow2.on("show", updateContextMenu);
  mainWindow2.on("hide", updateContextMenu);
  mainWindow2.on("minimize", updateContextMenu);
  mainWindow2.on("restore", updateContextMenu);
  return tray;
}
function toggleWindowVisibility(window) {
  isTogglingWindow = true;
  if (window.isVisible() && !window.isMinimized()) {
    console.log("Hiding window to tray");
    window.hide();
    if (process.platform === "darwin") {
      app.dock.hide();
    }
    setTimeout(() => {
      isTogglingWindow = false;
    }, 300);
  } else {
    console.log("Showing window from tray");
    showWindow(window);
    setTimeout(() => {
      isTogglingWindow = false;
    }, 500);
  }
}
function showWindow(window) {
  if (process.platform === "darwin") {
    app.dock.show();
  }
  if (window.isMinimized()) {
    window.restore();
  }
  window.show();
  window.focus();
  if (process.platform === "darwin") {
    app.focus({ steal: true });
  }
}
function handleWindowClose(window, event) {
  if (tray && !app.isQuitting) {
    event.preventDefault();
    window.hide();
    if (process.platform === "darwin") {
      app.dock.hide();
    }
    return false;
  }
  return true;
}
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
const store = new Store();
app.isQuitting = false;
function setupIpcHandlers() {
  ipcMain.handle("ping", () => {
    return "pong";
  });
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });
  ipcMain.handle("platform-info", () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      versions: process.versions
    };
  });
  setupSettingsHandlers();
}
let mainWindow = null;
function getWindowBounds() {
  const defaultBounds = { width: 1200, height: 800 };
  const savedBounds = store.get("windowBounds");
  if (savedBounds) {
    return {
      ...defaultBounds,
      ...savedBounds
    };
  }
  return defaultBounds;
}
function saveWindowBounds() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  store.set("windowBounds", bounds);
}
function createWindow() {
  const bounds = getWindowBounds();
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
    if (mainWindow) {
      createApplicationMenu(mainWindow);
    }
    if (mainWindow) {
      createTray(mainWindow);
    }
    if (is.dev) {
      mainWindow?.webContents.openDevTools();
    }
  });
  mainWindow.on("resize", saveWindowBounds);
  mainWindow.on("move", saveWindowBounds);
  mainWindow.on("close", (event) => {
    if (mainWindow) {
      handleWindowClose(mainWindow, event);
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.devutils.hub");
  }
  setupIpcHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  app.isQuitting = true;
  if (mainWindow) {
    saveWindowBounds();
  }
  destroyTray();
});

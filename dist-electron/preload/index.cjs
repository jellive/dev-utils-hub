"use strict";
const electron = require("electron");
const api = {
  // Test IPC communication
  ping: () => electron.ipcRenderer.invoke("ping"),
  // Get application version
  getAppVersion: () => electron.ipcRenderer.invoke("get-app-version"),
  // Get platform information
  getPlatformInfo: () => electron.ipcRenderer.invoke("platform-info"),
  // Settings API
  settings: {
    get: (key) => electron.ipcRenderer.invoke("settings:get", key),
    set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value),
    getAll: () => electron.ipcRenderer.invoke("settings:get-all"),
    reset: () => electron.ipcRenderer.invoke("settings:reset"),
    delete: (key) => electron.ipcRenderer.invoke("settings:delete", key),
    setAutoStart: (enabled, startMinimized) => electron.ipcRenderer.invoke("settings:set-auto-start", enabled, startMinimized),
    getAutoStart: () => electron.ipcRenderer.invoke("settings:get-auto-start")
  },
  // Shortcut events API
  shortcuts: {
    onOpenSettings: (callback) => {
      electron.ipcRenderer.on("shortcut:open-settings", callback);
      return () => electron.ipcRenderer.removeListener("shortcut:open-settings", callback);
    },
    onToggleHistory: (callback) => {
      electron.ipcRenderer.on("shortcut:toggle-history", callback);
      return () => electron.ipcRenderer.removeListener("shortcut:toggle-history", callback);
    },
    onSwitchTool: (callback) => {
      electron.ipcRenderer.on("shortcut:switch-tool", (_event, route) => callback(route));
      return () => electron.ipcRenderer.removeAllListeners("shortcut:switch-tool");
    },
    // Shortcut management API
    getAll: () => electron.ipcRenderer.invoke("shortcuts:get-all"),
    updateGlobal: (accelerator) => electron.ipcRenderer.invoke("shortcuts:update-global", accelerator),
    reset: () => electron.ipcRenderer.invoke("shortcuts:reset"),
    validate: (accelerator) => electron.ipcRenderer.invoke("shortcuts:validate", accelerator),
    getRegistered: () => electron.ipcRenderer.invoke("shortcuts:get-registered")
  },
  // History API
  history: {
    save: (tool, input, output, metadata) => electron.ipcRenderer.invoke("history:save", tool, input, output, metadata),
    get: (tool, limit) => electron.ipcRenderer.invoke("history:get", tool, limit),
    getWithOptions: (tool, options) => electron.ipcRenderer.invoke("history:get-with-options", tool, options),
    count: (tool) => electron.ipcRenderer.invoke("history:count", tool),
    search: (tool, query, limit) => electron.ipcRenderer.invoke("history:search", tool, query, limit),
    getById: (id) => electron.ipcRenderer.invoke("history:get-by-id", id),
    delete: (id) => electron.ipcRenderer.invoke("history:delete", id),
    toggleFavorite: (id) => electron.ipcRenderer.invoke("history:toggle-favorite", id),
    clear: (tool) => electron.ipcRenderer.invoke("history:clear", tool),
    clearAll: () => electron.ipcRenderer.invoke("history:clear-all"),
    autoCleanup: (daysOld, keepFavorites) => electron.ipcRenderer.invoke("history:auto-cleanup", daysOld, keepFavorites),
    stats: () => electron.ipcRenderer.invoke("history:stats"),
    // Event listeners for menu-triggered actions
    onToggle: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("toggle-history-panel", listener);
      return () => electron.ipcRenderer.removeListener("toggle-history-panel", listener);
    },
    onExport: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("trigger-export", listener);
      return () => electron.ipcRenderer.removeListener("trigger-export", listener);
    },
    onImport: (callback) => {
      const listener = () => callback();
      electron.ipcRenderer.on("trigger-import", listener);
      return () => electron.ipcRenderer.removeListener("trigger-import", listener);
    }
  },
  // Maintenance API
  maintenance: {
    cleanup: (dryRun) => electron.ipcRenderer.invoke("maintenance:cleanup", dryRun),
    backup: () => electron.ipcRenderer.invoke("maintenance:backup"),
    restore: (backupPath) => electron.ipcRenderer.invoke("maintenance:restore", backupPath),
    stats: () => electron.ipcRenderer.invoke("maintenance:stats"),
    listBackups: () => electron.ipcRenderer.invoke("maintenance:list-backups")
  },
  // Clipboard API
  clipboard: {
    readText: () => electron.ipcRenderer.invoke("clipboard:read-text"),
    writeText: (text) => electron.ipcRenderer.invoke("clipboard:write-text", text),
    clear: () => electron.ipcRenderer.invoke("clipboard:clear")
  },
  // File System API
  file: {
    save: (content, defaultFileName, filters) => electron.ipcRenderer.invoke("file:save", content, defaultFileName, filters),
    open: (filters) => electron.ipcRenderer.invoke("file:open", filters)
  },
  // Navigation API - for menu-triggered navigation
  navigation: {
    onNavigateToTool: (callback) => {
      const listener = (_event, path) => callback(path);
      electron.ipcRenderer.on("navigate-to-tool", listener);
      return () => electron.ipcRenderer.removeListener("navigate-to-tool", listener);
    },
    onNavigateTo: (callback) => {
      const listener = (_event, path) => callback(path);
      electron.ipcRenderer.on("navigate-to", listener);
      return () => electron.ipcRenderer.removeListener("navigate-to", listener);
    }
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}

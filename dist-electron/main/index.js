import { app, ipcMain, clipboard, BrowserWindow, dialog, shell, Menu, nativeImage, Tray, globalShortcut } from "electron";
import path, { join } from "path";
import Store from "electron-store";
import Database from "better-sqlite3";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync, promises } from "fs";
import electronLocalShortcut from "electron-localshortcut";
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
    shortcuts: {
      toggleApp: process.platform === "darwin" ? "Command+Shift+Space" : "Control+Space"
    },
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
  ipcMain.handle("shortcuts:get-all", () => {
    try {
      return settingsStore.get("shortcuts");
    } catch (error) {
      console.error("Failed to get shortcuts:", error);
      return null;
    }
  });
  ipcMain.handle("shortcuts:update-global", async (_event, accelerator) => {
    try {
      const { updateGlobalShortcut: updateGlobalShortcut2 } = await Promise.resolve().then(() => shortcuts);
      const success = updateGlobalShortcut2(accelerator);
      return success;
    } catch (error) {
      console.error("Failed to update global shortcut:", error);
      return false;
    }
  });
  ipcMain.handle("shortcuts:reset", () => {
    try {
      const defaultShortcuts = {
        toggleApp: process.platform === "darwin" ? "Command+Shift+Space" : "Control+Space"
      };
      settingsStore.set("shortcuts", defaultShortcuts);
      Promise.resolve().then(() => shortcuts).then(({ updateGlobalShortcut: updateGlobalShortcut2 }) => {
        updateGlobalShortcut2(defaultShortcuts.toggleApp);
      });
      return true;
    } catch (error) {
      console.error("Failed to reset shortcuts:", error);
      return false;
    }
  });
  ipcMain.handle("shortcuts:validate", async (_event, accelerator) => {
    try {
      const { validateShortcut: validateShortcut2 } = await Promise.resolve().then(() => shortcuts);
      return validateShortcut2(accelerator);
    } catch (error) {
      console.error("Failed to validate shortcut:", error);
      return {
        valid: false,
        conflicts: ["Validation error"],
        warnings: []
      };
    }
  });
  ipcMain.handle("shortcuts:get-registered", async () => {
    try {
      const { getRegisteredShortcuts: getRegisteredShortcuts2 } = await Promise.resolve().then(() => shortcuts);
      return getRegisteredShortcuts2();
    } catch (error) {
      console.error("Failed to get registered shortcuts:", error);
      return [];
    }
  });
}
let db = null;
function initializeDatabase() {
  if (db) {
    return db;
  }
  const userDataPath = app.getPath("userData");
  const dbPath = join(userDataPath, "history.db");
  console.log(`📦 Initializing database at: ${dbPath}`);
  try {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    createTables();
    const integrityCheck = db.pragma("integrity_check");
    const isHealthy = integrityCheck.length === 1 && integrityCheck[0].integrity_check === "ok";
    if (!isHealthy) {
      console.error("⚠️  Database integrity check failed:", integrityCheck);
      console.error("⚠️  Database may be corrupted. Please check the database file.");
    } else {
      console.log("✓ Database integrity check passed");
    }
    console.log("✓ Database initialized successfully");
    return db;
  } catch (error) {
    console.error("✗ Failed to initialize database:", error);
    throw error;
  }
}
function createTables() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      metadata TEXT,
      favorite INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000)
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_history_tool ON history(tool);
    CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_history_favorite ON history(favorite);
    CREATE INDEX IF NOT EXISTS idx_history_tool_created ON history(tool, created_at DESC);
  `);
  console.log("✓ Database tables and indexes created");
}
function getDatabase() {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log("✓ Database connection closed");
  }
}
function backupDatabase(backupPath) {
  if (!db) {
    throw new Error("Database not initialized");
  }
  try {
    db.backup(backupPath);
    console.log(`✓ Database backed up to: ${backupPath}`);
  } catch (error) {
    console.error("✗ Failed to backup database:", error);
    throw error;
  }
}
function retryOperation(operation, maxRetries = 3, initialDelay = 100) {
  let lastError = null;
  let delay = initialDelay;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = operation();
      return {
        success: true,
        data: result,
        retried: attempt > 0
      };
    } catch (error) {
      lastError = error;
      if (error.code === "SQLITE_BUSY" && attempt < maxRetries - 1) {
        console.warn(`⚠️  Database busy, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        delay *= 2;
        continue;
      }
      break;
    }
  }
  console.error("✗ Database operation failed after retries:", lastError);
  return {
    success: false,
    error: lastError?.message || "Unknown database error"
  };
}
function validateMetadata(metadata) {
  if (!metadata) return null;
  try {
    const json = JSON.stringify(metadata);
    JSON.parse(json);
    return json;
  } catch (error) {
    console.error("✗ Invalid metadata JSON:", error);
    throw new Error("Metadata must be a valid JSON object");
  }
}
function saveHistory(tool, input, output, metadata) {
  const result = retryOperation(() => {
    const db2 = getDatabase();
    const metadataJson = validateMetadata(metadata);
    const stmt = db2.prepare(`
      INSERT INTO history (tool, input, output, metadata)
      VALUES (?, ?, ?, ?)
    `);
    const insertResult = stmt.run(tool, input, output || null, metadataJson);
    return insertResult.lastInsertRowid;
  });
  if (!result.success) {
    throw new Error(`Failed to save history: ${result.error}`);
  }
  console.log(`✓ History saved: ${tool} (id: ${result.data})${result.retried ? " (retried)" : ""}`);
  return result.data;
}
function getHistory(tool, limit = 50) {
  const db2 = getDatabase();
  let query = `
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
  `;
  const params = [];
  if (tool) {
    query += " WHERE tool = ?";
    params.push(tool);
  }
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  const stmt = db2.prepare(query);
  const rows = stmt.all(...params);
  console.log(`✓ Retrieved ${rows.length} history entries${tool ? ` for ${tool}` : ""}`);
  return rows;
}
function searchHistory(tool, query, limit = 50) {
  const db2 = getDatabase();
  const stmt = db2.prepare(`
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
    WHERE tool = ? AND (input LIKE ? OR output LIKE ?)
    ORDER BY created_at DESC
    LIMIT ?
  `);
  const searchPattern = `%${query}%`;
  const rows = stmt.all(tool, searchPattern, searchPattern, limit);
  console.log(`✓ Search found ${rows.length} entries for "${query}" in ${tool}`);
  return rows;
}
function getHistoryById(id) {
  const db2 = getDatabase();
  const stmt = db2.prepare(`
    SELECT id, tool, input, output, metadata, favorite, created_at
    FROM history
    WHERE id = ?
  `);
  const row = stmt.get(id);
  return row;
}
function deleteHistory(id) {
  const db2 = getDatabase();
  const stmt = db2.prepare("DELETE FROM history WHERE id = ?");
  const result = stmt.run(id);
  const deleted = result.changes > 0;
  if (deleted) {
    console.log(`✓ History entry deleted: ${id}`);
  } else {
    console.warn(`⚠️  History entry not found: ${id}`);
  }
  return deleted;
}
function toggleFavorite(id) {
  const db2 = getDatabase();
  const current = db2.prepare("SELECT favorite FROM history WHERE id = ?").get(id);
  if (!current) {
    console.warn(`⚠️  History entry not found: ${id}`);
    return false;
  }
  const newFavorite = current.favorite === 1 ? 0 : 1;
  const stmt = db2.prepare("UPDATE history SET favorite = ? WHERE id = ?");
  const result = stmt.run(newFavorite, id);
  const updated = result.changes > 0;
  if (updated) {
    console.log(`✓ Favorite toggled for history entry ${id}: ${newFavorite === 1 ? "ON" : "OFF"}`);
  }
  return updated;
}
function clearHistory(tool) {
  const db2 = getDatabase();
  const stmt = db2.prepare("DELETE FROM history WHERE tool = ?");
  const result = stmt.run(tool);
  console.log(`✓ Cleared ${result.changes} history entries for ${tool}`);
  return result.changes;
}
function clearAllHistory() {
  const db2 = getDatabase();
  const stmt = db2.prepare("DELETE FROM history");
  const result = stmt.run();
  console.log(`✓ Cleared all history: ${result.changes} entries`);
  return result.changes;
}
function autoCleanup(daysOld = 90, keepFavorites = true) {
  const db2 = getDatabase();
  const cutoffTimestamp = Math.floor(Date.now() / 1e3) - daysOld * 24 * 60 * 60;
  let query = "DELETE FROM history WHERE created_at < ?";
  const params = [cutoffTimestamp];
  if (keepFavorites) {
    query += " AND favorite = 0";
  }
  const stmt = db2.prepare(query);
  const result = stmt.run(...params);
  console.log(`✓ Auto-cleanup removed ${result.changes} entries older than ${daysOld} days`);
  return result.changes;
}
function getHistoryStats() {
  const db2 = getDatabase();
  const totalRow = db2.prepare("SELECT COUNT(*) as count FROM history").get();
  const total = totalRow.count;
  const byToolRows = db2.prepare("SELECT tool, COUNT(*) as count FROM history GROUP BY tool").all();
  const byTool = {};
  byToolRows.forEach((row) => {
    byTool[row.tool] = row.count;
  });
  const favoritesRow = db2.prepare("SELECT COUNT(*) as count FROM history WHERE favorite = 1").get();
  const favorites = favoritesRow.count;
  const oldestRow = db2.prepare("SELECT MIN(created_at) as oldest FROM history").get();
  const newestRow = db2.prepare("SELECT MAX(created_at) as newest FROM history").get();
  return {
    total,
    byTool,
    favorites,
    oldestEntry: oldestRow.oldest,
    newestEntry: newestRow.newest
  };
}
function vacuumDatabase() {
  try {
    const db2 = getDatabase();
    db2.exec("VACUUM");
    console.log("✓ Database vacuumed successfully");
    return {
      success: true
    };
  } catch (error) {
    console.error("✗ Failed to vacuum database:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
const DEFAULT_CONFIG = {
  cleanupIntervalHours: 24,
  daysToKeep: 90,
  keepFavorites: true,
  maxBackups: 5,
  enableAutoCleanup: true,
  enablePeriodicBackup: true
};
let cleanupTimer = null;
let backupTimer = null;
let stats = {
  lastCleanup: null,
  lastBackup: null,
  recordsDeleted: 0,
  backupsCreated: 0
};
function getBackupsDir() {
  const userDataPath = app.getPath("userData");
  const backupsDir = join(userDataPath, "backups");
  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
    console.log(`✓ Created backups directory: ${backupsDir}`);
  }
  return backupsDir;
}
function createTimestampedBackup() {
  const backupsDir = getBackupsDir();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const backupPath = join(backupsDir, `history-backup-${timestamp}.db`);
  try {
    backupDatabase(backupPath);
    stats.lastBackup = Date.now();
    stats.backupsCreated++;
    console.log(`✓ Created backup: ${backupPath}`);
    rotateBackups();
    return backupPath;
  } catch (error) {
    console.error("✗ Failed to create backup:", error);
    throw error;
  }
}
function rotateBackups() {
  const backupsDir = getBackupsDir();
  const config = getMaintenanceConfig();
  try {
    const files = readdirSync(backupsDir).filter((file) => file.startsWith("history-backup-") && file.endsWith(".db")).map((file) => ({
      name: file,
      path: join(backupsDir, file),
      mtime: statSync(join(backupsDir, file)).mtime.getTime()
    })).sort((a, b) => b.mtime - a.mtime);
    if (files.length > config.maxBackups) {
      const filesToDelete = files.slice(config.maxBackups);
      filesToDelete.forEach((file) => {
        unlinkSync(file.path);
        console.log(`✓ Deleted old backup: ${file.name}`);
      });
      console.log(`✓ Backup rotation complete: kept ${config.maxBackups}, deleted ${filesToDelete.length}`);
    }
  } catch (error) {
    console.error("✗ Failed to rotate backups:", error);
  }
}
function restoreFromBackup(backupPath) {
  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  const userDataPath = app.getPath("userData");
  const dbPath = join(userDataPath, "history.db");
  try {
    const safetyBackupPath = join(getBackupsDir(), `history-pre-restore-${Date.now()}.db`);
    if (existsSync(dbPath)) {
      copyFileSync(dbPath, safetyBackupPath);
      console.log(`✓ Created safety backup: ${safetyBackupPath}`);
    }
    const db2 = getDatabase();
    db2.close();
    copyFileSync(backupPath, dbPath);
    console.log(`✓ Restored database from: ${backupPath}`);
    console.log("⚠️  Application restart required to use restored database");
  } catch (error) {
    console.error("✗ Failed to restore backup:", error);
    throw error;
  }
}
function getMaintenanceConfig() {
  return DEFAULT_CONFIG;
}
function runCleanup(dryRun = false) {
  const config = getMaintenanceConfig();
  try {
    console.log(`🔄 Running database cleanup (dryRun: ${dryRun})...`);
    if (dryRun) {
      const db2 = getDatabase();
      const cutoffTimestamp = Math.floor(Date.now() / 1e3) - config.daysToKeep * 24 * 60 * 60;
      let query = "SELECT COUNT(*) as count FROM history WHERE created_at < ?";
      const params = [cutoffTimestamp];
      if (config.keepFavorites) {
        query += " AND favorite = 0";
      }
      const result = db2.prepare(query).get(...params);
      console.log(`ℹ️  Dry-run: Would delete ${result.count} records`);
      return result.count;
    }
    if (config.enablePeriodicBackup) {
      createTimestampedBackup();
    }
    const deletedCount = autoCleanup(config.daysToKeep, config.keepFavorites);
    vacuumDatabase();
    stats.lastCleanup = Date.now();
    stats.recordsDeleted += deletedCount;
    console.log(`✓ Cleanup complete: deleted ${deletedCount} records`);
    return deletedCount;
  } catch (error) {
    console.error("✗ Cleanup failed:", error);
    throw error;
  }
}
function initializeMaintenance() {
  const config = getMaintenanceConfig();
  console.log("🔧 Initializing maintenance system...");
  console.log(`   Cleanup interval: ${config.cleanupIntervalHours} hours`);
  console.log(`   Days to keep: ${config.daysToKeep}`);
  console.log(`   Keep favorites: ${config.keepFavorites}`);
  console.log(`   Max backups: ${config.maxBackups}`);
  console.log(`   Auto cleanup: ${config.enableAutoCleanup}`);
  console.log(`   Periodic backup: ${config.enablePeriodicBackup}`);
  {
    try {
      createTimestampedBackup();
    } catch (error) {
      console.error("⚠️  Failed to create initial backup:", error);
    }
  }
  {
    setTimeout(() => {
      try {
        runCleanup();
      } catch (error) {
        console.error("⚠️  Initial cleanup failed:", error);
      }
    }, 30 * 1e3);
  }
  {
    const intervalMs = config.cleanupIntervalHours * 60 * 60 * 1e3;
    cleanupTimer = setInterval(() => {
      try {
        runCleanup();
      } catch (error) {
        console.error("⚠️  Periodic cleanup failed:", error);
      }
    }, intervalMs);
    console.log(`✓ Periodic cleanup scheduled (every ${config.cleanupIntervalHours} hours)`);
  }
  {
    const backupIntervalMs = 6 * 60 * 60 * 1e3;
    backupTimer = setInterval(() => {
      try {
        createTimestampedBackup();
      } catch (error) {
        console.error("⚠️  Periodic backup failed:", error);
      }
    }, backupIntervalMs);
    console.log("✓ Periodic backup scheduled (every 6 hours)");
  }
  console.log("✓ Maintenance system initialized");
}
function stopMaintenance() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }
  console.log("✓ Maintenance system stopped");
}
function getMaintenanceStats() {
  return { ...stats };
}
function listBackups() {
  const backupsDir = getBackupsDir();
  try {
    const files = readdirSync(backupsDir).filter((file) => file.startsWith("history-backup-") && file.endsWith(".db")).map((file) => {
      const filePath = join(backupsDir, file);
      const fileStat = statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: fileStat.size,
        date: fileStat.mtime
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
    return files;
  } catch (error) {
    console.error("✗ Failed to list backups:", error);
    return [];
  }
}
function setupHistoryHandlers() {
  ipcMain.handle(
    "history:save",
    (_event, tool, input, output, metadata) => {
      try {
        console.log("🟢 [IPC] history:save called with:", { tool, input, output, metadata });
        const result = saveHistory(tool, input, output, metadata);
        console.log("🟢 [IPC] history:save result:", result);
        return result;
      } catch (error) {
        console.error("🔴 [IPC] Failed to save history:", error);
        throw error;
      }
    }
  );
  ipcMain.handle("history:get", (_event, tool, limit) => {
    try {
      return getHistory(tool, limit);
    } catch (error) {
      console.error("Failed to get history:", error);
      throw error;
    }
  });
  ipcMain.handle(
    "history:search",
    (_event, tool, query, limit) => {
      try {
        return searchHistory(tool, query, limit);
      } catch (error) {
        console.error("Failed to search history:", error);
        throw error;
      }
    }
  );
  ipcMain.handle("history:get-by-id", (_event, id) => {
    try {
      return getHistoryById(id);
    } catch (error) {
      console.error("Failed to get history by ID:", error);
      throw error;
    }
  });
  ipcMain.handle("history:delete", (_event, id) => {
    try {
      return deleteHistory(id);
    } catch (error) {
      console.error("Failed to delete history:", error);
      throw error;
    }
  });
  ipcMain.handle("history:toggle-favorite", (_event, id) => {
    try {
      return toggleFavorite(id);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw error;
    }
  });
  ipcMain.handle("history:clear", (_event, tool) => {
    try {
      return clearHistory(tool);
    } catch (error) {
      console.error("Failed to clear history:", error);
      throw error;
    }
  });
  ipcMain.handle("history:clear-all", () => {
    try {
      return clearAllHistory();
    } catch (error) {
      console.error("Failed to clear all history:", error);
      throw error;
    }
  });
  ipcMain.handle(
    "history:auto-cleanup",
    (_event, daysOld, keepFavorites) => {
      try {
        return autoCleanup(daysOld, keepFavorites);
      } catch (error) {
        console.error("Failed to auto-cleanup history:", error);
        throw error;
      }
    }
  );
  ipcMain.handle("history:stats", () => {
    try {
      return getHistoryStats();
    } catch (error) {
      console.error("Failed to get history stats:", error);
      throw error;
    }
  });
  ipcMain.handle("maintenance:cleanup", (_event, dryRun) => {
    try {
      return runCleanup(dryRun);
    } catch (error) {
      console.error("Failed to run cleanup:", error);
      throw error;
    }
  });
  ipcMain.handle("maintenance:backup", () => {
    try {
      return createTimestampedBackup();
    } catch (error) {
      console.error("Failed to create backup:", error);
      throw error;
    }
  });
  ipcMain.handle("maintenance:restore", (_event, backupPath) => {
    try {
      restoreFromBackup(backupPath);
    } catch (error) {
      console.error("Failed to restore backup:", error);
      throw error;
    }
  });
  ipcMain.handle("maintenance:stats", () => {
    try {
      return getMaintenanceStats();
    } catch (error) {
      console.error("Failed to get maintenance stats:", error);
      throw error;
    }
  });
  ipcMain.handle("maintenance:list-backups", () => {
    try {
      return listBackups();
    } catch (error) {
      console.error("Failed to list backups:", error);
      throw error;
    }
  });
  console.log("✓ History IPC handlers registered");
}
function setupClipboardHandlers() {
  ipcMain.handle("clipboard:read-text", () => {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      throw error;
    }
  });
  ipcMain.handle("clipboard:write-text", (_event, text) => {
    try {
      clipboard.writeText(text);
      console.log("✓ Text written to clipboard");
      return true;
    } catch (error) {
      console.error("Failed to write to clipboard:", error);
      throw error;
    }
  });
  ipcMain.handle("clipboard:clear", () => {
    try {
      clipboard.clear();
      console.log("✓ Clipboard cleared");
      return true;
    } catch (error) {
      console.error("Failed to clear clipboard:", error);
      throw error;
    }
  });
  console.log("✓ Clipboard IPC handlers registered");
}
const FILE_FILTERS = [
  { name: "JSON Files", extensions: ["json"] },
  { name: "Text Files", extensions: ["txt"] },
  { name: "XML Files", extensions: ["xml"] },
  { name: "CSV Files", extensions: ["csv"] },
  { name: "All Files", extensions: ["*"] }
];
function mapErrorToFileErrorCode(error) {
  const code = error?.code || error?.errno;
  if (code === "EACCES" || code === "EPERM") {
    return "PERMISSION_DENIED";
  }
  if (code === "ENOSPC") {
    return "DISK_FULL";
  }
  if (code === "ENOENT") {
    return "FILE_NOT_FOUND";
  }
  if (code === "EINVAL") {
    return "INVALID_PATH";
  }
  return "UNKNOWN_ERROR";
}
function createErrorMessage(code, filePath) {
  switch (code) {
    case "CANCELLED":
      return "파일 선택이 취소되었습니다";
    case "PERMISSION_DENIED":
      return `파일에 대한 접근 권한이 없습니다${filePath ? `: ${filePath}` : ""}`;
    case "DISK_FULL":
      return "디스크 공간이 부족합니다";
    case "FILE_NOT_FOUND":
      return `파일을 찾을 수 없습니다${filePath ? `: ${filePath}` : ""}`;
    case "INVALID_PATH":
      return "잘못된 파일 경로입니다";
    default:
      return "파일 작업 중 오류가 발생했습니다";
  }
}
function setupFileHandlers() {
  ipcMain.handle(
    "file:save",
    async (_event, content, defaultFileName, filters) => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        const result = await dialog.showSaveDialog(focusedWindow, {
          title: "파일 저장",
          defaultPath: defaultFileName || "untitled.txt",
          filters: filters || FILE_FILTERS,
          properties: ["createDirectory", "showOverwriteConfirmation"]
        });
        if (result.canceled || !result.filePath) {
          return {
            success: false,
            error: {
              code: "CANCELLED",
              message: createErrorMessage(
                "CANCELLED"
                /* CANCELLED */
              )
            }
          };
        }
        const filePath = result.filePath;
        if (!path.isAbsolute(filePath)) {
          return {
            success: false,
            error: {
              code: "INVALID_PATH",
              message: createErrorMessage("INVALID_PATH", filePath)
            }
          };
        }
        await promises.writeFile(filePath, content, "utf-8");
        console.log(`✓ File saved successfully: ${filePath}`);
        return {
          success: true,
          filePath
        };
      } catch (error) {
        const errorCode = mapErrorToFileErrorCode(error);
        const errorMessage = createErrorMessage(errorCode);
        console.error("Failed to save file:", error);
        return {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            originalError: error
          }
        };
      }
    }
  );
  ipcMain.handle(
    "file:open",
    async (_event, filters) => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        const result = await dialog.showOpenDialog(focusedWindow, {
          title: "파일 열기",
          filters: filters || FILE_FILTERS,
          properties: ["openFile"]
        });
        if (result.canceled || result.filePaths.length === 0) {
          return {
            success: false,
            error: {
              code: "CANCELLED",
              message: createErrorMessage(
                "CANCELLED"
                /* CANCELLED */
              )
            }
          };
        }
        const filePath = result.filePaths[0];
        if (!path.isAbsolute(filePath)) {
          return {
            success: false,
            error: {
              code: "INVALID_PATH",
              message: createErrorMessage("INVALID_PATH", filePath)
            }
          };
        }
        const content = await promises.readFile(filePath, "utf-8");
        console.log(`✓ File opened successfully: ${filePath}`);
        return {
          success: true,
          content,
          filePath
        };
      } catch (error) {
        const errorCode = mapErrorToFileErrorCode(error);
        const errorMessage = createErrorMessage(errorCode);
        console.error("Failed to open file:", error);
        return {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            originalError: error
          }
        };
      }
    }
  );
  console.log("✓ File IPC handlers registered");
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
    if (tray) {
      tray.setContextMenu(contextMenu);
    }
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
let mainWindow$1 = null;
let currentShortcut = null;
function registerGlobalShortcuts(window) {
  mainWindow$1 = window;
  const shortcuts2 = settingsStore.get("shortcuts");
  const toggleShortcut = shortcuts2?.toggleApp || (process.platform === "darwin" ? "Command+Shift+Space" : "Control+Space");
  const registered = globalShortcut.register(toggleShortcut, () => {
    console.log(`Global shortcut triggered: ${toggleShortcut}`);
    if (mainWindow$1) {
      toggleWindowVisibility(mainWindow$1);
    }
  });
  if (registered) {
    currentShortcut = toggleShortcut;
    trackShortcut(toggleShortcut, "global", "Toggle app visibility");
    console.log(`✓ Global shortcut registered: ${toggleShortcut}`);
  } else {
    console.error(`✗ Failed to register global shortcut: ${toggleShortcut}`);
    console.error("  This shortcut may already be in use by another application");
  }
}
function updateGlobalShortcut(accelerator) {
  const validation = validateShortcut(accelerator);
  if (!validation.valid) {
    console.error(`✗ Invalid shortcut: ${accelerator}`);
    console.error(`  Conflicts: ${validation.conflicts.join(", ")}`);
    return false;
  }
  if (validation.warnings.length > 0) {
    console.warn(`⚠️  Warnings for ${accelerator}:`);
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
  if (currentShortcut) {
    globalShortcut.unregister(currentShortcut);
    untrackShortcut(currentShortcut);
  }
  const registered = globalShortcut.register(accelerator, () => {
    console.log(`Global shortcut triggered: ${accelerator}`);
    if (mainWindow$1) {
      toggleWindowVisibility(mainWindow$1);
    }
  });
  if (registered) {
    currentShortcut = accelerator;
    trackShortcut(accelerator, "global", "Toggle app visibility");
    const shortcuts2 = settingsStore.get("shortcuts") || { toggleApp: accelerator };
    shortcuts2.toggleApp = accelerator;
    settingsStore.set("shortcuts", shortcuts2);
    console.log(`✓ Global shortcut updated to: ${accelerator}`);
    return true;
  } else {
    if (currentShortcut) {
      globalShortcut.register(currentShortcut, () => {
        if (mainWindow$1) {
          toggleWindowVisibility(mainWindow$1);
        }
      });
      trackShortcut(currentShortcut, "global", "Toggle app visibility");
    }
    console.error(`✗ Failed to register new shortcut: ${accelerator}`);
    return false;
  }
}
function unregisterGlobalShortcuts() {
  if (currentShortcut) {
    untrackShortcut(currentShortcut);
  }
  globalShortcut.unregisterAll();
  console.log("✓ All global shortcuts unregistered");
}
function registerWindowShortcuts(window) {
  const isMac = process.platform === "darwin";
  const settingsShortcut = isMac ? "Command+," : "Ctrl+,";
  electronLocalShortcut.register(window, settingsShortcut, () => {
    console.log("Settings shortcut triggered");
    window.webContents.send("shortcut:open-settings");
  });
  trackShortcut(settingsShortcut, "window", "Open settings");
  const historyShortcut = isMac ? "Command+H" : "Ctrl+H";
  electronLocalShortcut.register(window, historyShortcut, () => {
    console.log("Toggle history shortcut triggered");
    window.webContents.send("shortcut:toggle-history");
  });
  trackShortcut(historyShortcut, "window", "Toggle history panel");
  const minimizeShortcut = isMac ? "Command+M" : "Ctrl+M";
  electronLocalShortcut.register(window, minimizeShortcut, () => {
    console.log("Minimize window shortcut triggered");
    window.minimize();
  });
  trackShortcut(minimizeShortcut, "window", "Minimize window");
  const closeShortcut = isMac ? "Command+W" : "Ctrl+W";
  electronLocalShortcut.register(window, closeShortcut, () => {
    console.log("Close/Hide window shortcut triggered");
    window.hide();
  });
  trackShortcut(closeShortcut, "window", "Close/Hide window");
  const fullscreenShortcut = isMac ? "Command+F" : "F11";
  electronLocalShortcut.register(window, fullscreenShortcut, () => {
    console.log("Fullscreen toggle shortcut triggered");
    window.setFullScreen(!window.isFullScreen());
  });
  trackShortcut(fullscreenShortcut, "window", "Toggle fullscreen");
  const toolRoutes = [
    "/",
    // Command+1: Home
    "/json",
    // Command+2: JSON Formatter
    "/jwt",
    // Command+3: JWT Decoder
    "/base64",
    // Command+4: Base64 Converter
    "/url",
    // Command+5: URL Converter
    "/regex",
    // Command+6: Regex Tester
    "/diff",
    // Command+7: Text Diff
    "/hash",
    // Command+8: Hash Generator
    "/uuid"
    // Command+9: UUID Generator
  ];
  toolRoutes.forEach((route, index) => {
    const number = index + 1;
    if (number <= 9) {
      const toolShortcut = isMac ? `Command+${number}` : `Ctrl+${number}`;
      electronLocalShortcut.register(window, toolShortcut, () => {
        console.log(`Tool switch shortcut triggered: ${number} -> ${route}`);
        window.webContents.send("shortcut:switch-tool", route);
      });
      trackShortcut(toolShortcut, "window", `Switch to tool ${number}`);
    }
  });
  console.log("✓ Window-specific shortcuts registered");
}
function unregisterWindowShortcuts(window) {
  const windowShortcuts = Array.from(registeredShortcuts.entries()).filter(([_, info]) => info.scope === "window").map(([accelerator]) => accelerator);
  windowShortcuts.forEach((accelerator) => untrackShortcut(accelerator));
  electronLocalShortcut.unregisterAll(window);
  console.log("✓ Window-specific shortcuts unregistered");
}
function checkAndLogConflicts() {
  const conflictReport = checkShortcutConflicts();
  if (conflictReport.hasConflicts) {
    console.error("⚠️  Shortcut conflicts detected:");
    conflictReport.conflicts.forEach(({ shortcut, issue }) => {
      console.error(`  - ${shortcut}: ${issue}`);
    });
  } else {
    console.log("✓ No shortcut conflicts detected");
  }
  const shortcuts2 = getRegisteredShortcuts();
  console.log("\n📋 Registered shortcuts:");
  shortcuts2.forEach(({ accelerator, scope, description }) => {
    console.log(`  [${scope}] ${accelerator}: ${description}`);
  });
}
const SYSTEM_RESERVED_SHORTCUTS = {
  darwin: [
    "Command+Space",
    // Spotlight
    "Command+Tab",
    // App switcher
    "Command+Q",
    // Quit app
    "Command+Option+Esc",
    // Force quit
    "Command+Shift+3",
    // Screenshot
    "Command+Shift+4",
    // Screenshot (region)
    "Command+Shift+5",
    // Screenshot options
    "Command+Control+Q",
    // Lock screen
    "Command+Control+Space",
    // Emoji picker
    "Command+H"
    // Hide app (macOS system shortcut)
  ],
  win32: [
    "Control+Escape",
    // Start menu
    "Alt+Tab",
    // App switcher
    "Alt+F4",
    // Close window
    "Windows+L",
    // Lock screen
    "Windows+D",
    // Show desktop
    "PrintScreen"
    // Screenshot
  ],
  linux: [
    "Alt+Tab",
    // App switcher
    "Control+Alt+Delete",
    // System monitor
    "Alt+F4",
    // Close window
    "PrintScreen"
    // Screenshot
  ]
};
const registeredShortcuts = /* @__PURE__ */ new Map();
function trackShortcut(accelerator, scope, description) {
  registeredShortcuts.set(accelerator, { accelerator, scope, description });
}
function untrackShortcut(accelerator) {
  registeredShortcuts.delete(accelerator);
}
function validateShortcut(accelerator) {
  const conflicts = [];
  const warnings = [];
  const systemShortcuts = SYSTEM_RESERVED_SHORTCUTS[process.platform] || [];
  if (systemShortcuts.includes(accelerator)) {
    conflicts.push(`System reserved shortcut: ${accelerator}`);
  }
  const existing = registeredShortcuts.get(accelerator);
  if (existing) {
    conflicts.push(`Already registered as '${existing.description}' (${existing.scope})`);
  }
  if (globalShortcut.isRegistered(accelerator)) {
    warnings.push(`Already registered globally (possibly by another application)`);
  }
  if (!isValidAccelerator(accelerator)) {
    conflicts.push(`Invalid shortcut format: ${accelerator}`);
  }
  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings
  };
}
function isValidAccelerator(accelerator) {
  const validModifiers = ["Command", "Cmd", "Control", "Ctrl", "Alt", "Option", "Shift", "Super", "Meta"];
  const parts = accelerator.split("+");
  if (parts.length === 0) return false;
  const key = parts[parts.length - 1];
  if (!key || key.length === 0) return false;
  const modifiers = parts.slice(0, -1);
  for (const modifier of modifiers) {
    if (!validModifiers.includes(modifier)) {
      return false;
    }
  }
  return true;
}
function getRegisteredShortcuts() {
  return Array.from(registeredShortcuts.values());
}
function checkShortcutConflicts() {
  const conflicts = [];
  for (const [accelerator] of registeredShortcuts) {
    const validation = validateShortcut(accelerator);
    if (!validation.valid) {
      conflicts.push({
        shortcut: accelerator,
        issue: validation.conflicts.join(", ")
      });
    }
  }
  return {
    hasConflicts: conflicts.length > 0,
    conflicts
  };
}
const shortcuts = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  checkAndLogConflicts,
  checkShortcutConflicts,
  getRegisteredShortcuts,
  registerGlobalShortcuts,
  registerWindowShortcuts,
  unregisterGlobalShortcuts,
  unregisterWindowShortcuts,
  updateGlobalShortcut,
  validateShortcut
}, Symbol.toStringTag, { value: "Module" }));
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
  setupHistoryHandlers();
  setupClipboardHandlers();
  setupFileHandlers();
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
      preload: join(__dirname, "../preload/index.cjs"),
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
    if (mainWindow) {
      registerGlobalShortcuts(mainWindow);
      registerWindowShortcuts(mainWindow);
      checkAndLogConflicts();
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
    if (mainWindow) {
      unregisterWindowShortcuts(mainWindow);
    }
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
  app.setName("Dev Utils Hub");
  if (process.platform === "win32") {
    app.setAppUserModelId("com.devutils.hub");
  }
  initializeDatabase();
  initializeMaintenance();
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
  unregisterGlobalShortcuts();
  stopMaintenance();
  closeDatabase();
});

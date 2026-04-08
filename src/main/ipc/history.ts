import { ipcMain } from 'electron';
import {
  saveHistory,
  getHistory,
  getHistoryWithOptions,
  getHistoryCount,
  searchHistory,
  getHistoryById,
  deleteHistory,
  toggleFavorite,
  clearHistory,
  clearAllHistory,
  autoCleanup,
  getHistoryStats,
  type HistoryEntry,
  type GetHistoryOptions,
} from '../db/queries';
import {
  runCleanup,
  createTimestampedBackup,
  restoreFromBackup,
  getMaintenanceStats,
  listBackups,
} from '../db/maintenance';

/**
 * Setup IPC handlers for history operations
 */
export function setupHistoryHandlers(): void {
  // Save history entry
  ipcMain.handle(
    'history:save',
    (
      _event,
      tool: string,
      input: string,
      output?: string,
      metadata?: Record<string, any>
    ): number => {
      try {
        console.log('🟢 [IPC] history:save called:', {
          tool,
          inputLength: input?.length,
          hasOutput: !!output,
        });
        const result = saveHistory(tool, input, output, metadata);
        console.log('🟢 [IPC] history:save result:', result);
        return result;
      } catch (error) {
        console.error('🔴 [IPC] Failed to save history:', error);
        throw error;
      }
    }
  );

  // Get history entries
  ipcMain.handle('history:get', (_event, tool?: string, limit?: number): HistoryEntry[] => {
    try {
      return getHistory(tool, limit);
    } catch (error) {
      console.error('Failed to get history:', error);
      throw error;
    }
  });

  // Get history entries with options
  ipcMain.handle(
    'history:get-with-options',
    (_event, tool: string, options?: GetHistoryOptions): HistoryEntry[] => {
      try {
        return getHistoryWithOptions(tool, options);
      } catch (error) {
        console.error('Failed to get history with options:', error);
        throw error;
      }
    }
  );

  // Get history count
  ipcMain.handle('history:count', (_event, tool: string): number => {
    try {
      return getHistoryCount(tool);
    } catch (error) {
      console.error('Failed to get history count:', error);
      throw error;
    }
  });

  // Search history
  ipcMain.handle(
    'history:search',
    (_event, tool: string, query: string, limit?: number): HistoryEntry[] => {
      try {
        return searchHistory(tool, query, limit);
      } catch (error) {
        console.error('Failed to search history:', error);
        throw error;
      }
    }
  );

  // Get history by ID
  ipcMain.handle('history:get-by-id', (_event, id: number): HistoryEntry | undefined => {
    try {
      return getHistoryById(id);
    } catch (error) {
      console.error('Failed to get history by ID:', error);
      throw error;
    }
  });

  // Delete history entry
  ipcMain.handle('history:delete', (_event, id: number): boolean => {
    try {
      return deleteHistory(id);
    } catch (error) {
      console.error('Failed to delete history:', error);
      throw error;
    }
  });

  // Toggle favorite
  ipcMain.handle('history:toggle-favorite', (_event, id: number): boolean => {
    try {
      return toggleFavorite(id);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  });

  // Clear history for tool
  ipcMain.handle('history:clear', (_event, tool: string): number => {
    try {
      return clearHistory(tool);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  });

  // Clear all history
  ipcMain.handle('history:clear-all', (): number => {
    try {
      return clearAllHistory();
    } catch (error) {
      console.error('Failed to clear all history:', error);
      throw error;
    }
  });

  // Auto-cleanup
  ipcMain.handle(
    'history:auto-cleanup',
    (_event, daysOld?: number, keepFavorites?: boolean): number => {
      try {
        return autoCleanup(daysOld, keepFavorites);
      } catch (error) {
        console.error('Failed to auto-cleanup history:', error);
        throw error;
      }
    }
  );

  // Get statistics
  ipcMain.handle('history:stats', () => {
    try {
      return getHistoryStats();
    } catch (error) {
      console.error('Failed to get history stats:', error);
      throw error;
    }
  });

  // Maintenance: Run cleanup
  ipcMain.handle('maintenance:cleanup', (_event, dryRun?: boolean): number => {
    try {
      return runCleanup(dryRun);
    } catch (error) {
      console.error('Failed to run cleanup:', error);
      throw error;
    }
  });

  // Maintenance: Create backup
  ipcMain.handle('maintenance:backup', (): string => {
    try {
      return createTimestampedBackup();
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  });

  // Maintenance: Restore backup
  ipcMain.handle('maintenance:restore', (_event, backupPath: string): void => {
    try {
      restoreFromBackup(backupPath);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  });

  // Maintenance: Get stats
  ipcMain.handle('maintenance:stats', () => {
    try {
      return getMaintenanceStats();
    } catch (error) {
      console.error('Failed to get maintenance stats:', error);
      throw error;
    }
  });

  // Maintenance: List backups
  ipcMain.handle('maintenance:list-backups', () => {
    try {
      return listBackups();
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw error;
    }
  });

  console.log('✓ History IPC handlers registered');
}

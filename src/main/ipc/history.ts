import { ipcMain } from 'electron'
import {
  saveHistory,
  getHistory,
  searchHistory,
  getHistoryById,
  deleteHistory,
  toggleFavorite,
  clearHistory,
  clearAllHistory,
  autoCleanup,
  getHistoryStats,
  type HistoryEntry
} from '../db/queries'

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
        return saveHistory(tool, input, output, metadata)
      } catch (error) {
        console.error('Failed to save history:', error)
        throw error
      }
    }
  )

  // Get history entries
  ipcMain.handle('history:get', (_event, tool?: string, limit?: number): HistoryEntry[] => {
    try {
      return getHistory(tool, limit)
    } catch (error) {
      console.error('Failed to get history:', error)
      throw error
    }
  })

  // Search history
  ipcMain.handle(
    'history:search',
    (_event, tool: string, query: string, limit?: number): HistoryEntry[] => {
      try {
        return searchHistory(tool, query, limit)
      } catch (error) {
        console.error('Failed to search history:', error)
        throw error
      }
    }
  )

  // Get history by ID
  ipcMain.handle('history:get-by-id', (_event, id: number): HistoryEntry | undefined => {
    try {
      return getHistoryById(id)
    } catch (error) {
      console.error('Failed to get history by ID:', error)
      throw error
    }
  })

  // Delete history entry
  ipcMain.handle('history:delete', (_event, id: number): boolean => {
    try {
      return deleteHistory(id)
    } catch (error) {
      console.error('Failed to delete history:', error)
      throw error
    }
  })

  // Toggle favorite
  ipcMain.handle('history:toggle-favorite', (_event, id: number): boolean => {
    try {
      return toggleFavorite(id)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      throw error
    }
  })

  // Clear history for tool
  ipcMain.handle('history:clear', (_event, tool: string): number => {
    try {
      return clearHistory(tool)
    } catch (error) {
      console.error('Failed to clear history:', error)
      throw error
    }
  })

  // Clear all history
  ipcMain.handle('history:clear-all', (): number => {
    try {
      return clearAllHistory()
    } catch (error) {
      console.error('Failed to clear all history:', error)
      throw error
    }
  })

  // Auto-cleanup
  ipcMain.handle(
    'history:auto-cleanup',
    (_event, daysOld?: number, keepFavorites?: boolean): number => {
      try {
        return autoCleanup(daysOld, keepFavorites)
      } catch (error) {
        console.error('Failed to auto-cleanup history:', error)
        throw error
      }
    }
  )

  // Get statistics
  ipcMain.handle('history:stats', () => {
    try {
      return getHistoryStats()
    } catch (error) {
      console.error('Failed to get history stats:', error)
      throw error
    }
  })

  console.log('✓ History IPC handlers registered')
}

import { ipcMain, clipboard } from 'electron'

/**
 * Setup IPC handlers for clipboard operations
 */
export function setupClipboardHandlers(): void {
  // Read text from clipboard
  ipcMain.handle('clipboard:read-text', (): string => {
    try {
      return clipboard.readText()
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      throw error
    }
  })

  // Write text to clipboard
  ipcMain.handle('clipboard:write-text', (_event, text: string): boolean => {
    try {
      clipboard.writeText(text)
      console.log('✓ Text written to clipboard')
      return true
    } catch (error) {
      console.error('Failed to write to clipboard:', error)
      throw error
    }
  })

  // Clear clipboard
  ipcMain.handle('clipboard:clear', (): boolean => {
    try {
      clipboard.clear()
      console.log('✓ Clipboard cleared')
      return true
    } catch (error) {
      console.error('Failed to clear clipboard:', error)
      throw error
    }
  })

  console.log('✓ Clipboard IPC handlers registered')
}

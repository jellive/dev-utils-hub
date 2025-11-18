import { ipcMain, dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * File operation error codes
 */
export enum FileErrorCode {
  CANCELLED = 'CANCELLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_PATH = 'INVALID_PATH',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * File operation error interface
 */
export interface FileError {
  code: FileErrorCode
  message: string
  originalError?: Error
}

/**
 * Save file result interface
 */
export interface SaveFileResult {
  success: boolean
  filePath?: string
  error?: FileError
}

/**
 * Open file result interface
 */
export interface OpenFileResult {
  success: boolean
  content?: string
  filePath?: string
  error?: FileError
}

/**
 * File filters for dialog
 */
const FILE_FILTERS = [
  { name: 'JSON Files', extensions: ['json'] },
  { name: 'Text Files', extensions: ['txt'] },
  { name: 'XML Files', extensions: ['xml'] },
  { name: 'CSV Files', extensions: ['csv'] },
  { name: 'All Files', extensions: ['*'] }
]

/**
 * Map system errors to FileErrorCode
 */
function mapErrorToFileErrorCode(error: any): FileErrorCode {
  const code = error?.code || error?.errno

  if (code === 'EACCES' || code === 'EPERM') {
    return FileErrorCode.PERMISSION_DENIED
  }
  if (code === 'ENOSPC') {
    return FileErrorCode.DISK_FULL
  }
  if (code === 'ENOENT') {
    return FileErrorCode.FILE_NOT_FOUND
  }
  if (code === 'EINVAL') {
    return FileErrorCode.INVALID_PATH
  }

  return FileErrorCode.UNKNOWN_ERROR
}

/**
 * Create user-friendly error message
 */
function createErrorMessage(code: FileErrorCode, filePath?: string): string {
  switch (code) {
    case FileErrorCode.CANCELLED:
      return '파일 선택이 취소되었습니다'
    case FileErrorCode.PERMISSION_DENIED:
      return `파일에 대한 접근 권한이 없습니다${filePath ? `: ${filePath}` : ''}`
    case FileErrorCode.DISK_FULL:
      return '디스크 공간이 부족합니다'
    case FileErrorCode.FILE_NOT_FOUND:
      return `파일을 찾을 수 없습니다${filePath ? `: ${filePath}` : ''}`
    case FileErrorCode.INVALID_PATH:
      return '잘못된 파일 경로입니다'
    default:
      return '파일 작업 중 오류가 발생했습니다'
  }
}

/**
 * Setup IPC handlers for file operations
 */
export function setupFileHandlers(): void {
  /**
   * Save file dialog and write operation
   */
  ipcMain.handle(
    'file:save',
    async (
      _event,
      content: string,
      defaultFileName?: string,
      filters?: typeof FILE_FILTERS
    ): Promise<SaveFileResult> => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow()

        // Show save dialog
        const result = await dialog.showSaveDialog(focusedWindow!, {
          title: '파일 저장',
          defaultPath: defaultFileName || 'untitled.txt',
          filters: filters || FILE_FILTERS,
          properties: ['createDirectory', 'showOverwriteConfirmation']
        })

        // User cancelled
        if (result.canceled || !result.filePath) {
          return {
            success: false,
            error: {
              code: FileErrorCode.CANCELLED,
              message: createErrorMessage(FileErrorCode.CANCELLED)
            }
          }
        }

        // Validate path
        const filePath = result.filePath
        if (!path.isAbsolute(filePath)) {
          return {
            success: false,
            error: {
              code: FileErrorCode.INVALID_PATH,
              message: createErrorMessage(FileErrorCode.INVALID_PATH, filePath)
            }
          }
        }

        // Write file
        await fs.writeFile(filePath, content, 'utf-8')

        console.log(`✓ File saved successfully: ${filePath}`)

        return {
          success: true,
          filePath
        }
      } catch (error: any) {
        const errorCode = mapErrorToFileErrorCode(error)
        const errorMessage = createErrorMessage(errorCode)

        console.error('Failed to save file:', error)

        return {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            originalError: error
          }
        }
      }
    }
  )

  /**
   * Open file dialog and read operation
   */
  ipcMain.handle(
    'file:open',
    async (_event, filters?: typeof FILE_FILTERS): Promise<OpenFileResult> => {
      try {
        const focusedWindow = BrowserWindow.getFocusedWindow()

        // Show open dialog
        const result = await dialog.showOpenDialog(focusedWindow!, {
          title: '파일 열기',
          filters: filters || FILE_FILTERS,
          properties: ['openFile']
        })

        // User cancelled
        if (result.canceled || result.filePaths.length === 0) {
          return {
            success: false,
            error: {
              code: FileErrorCode.CANCELLED,
              message: createErrorMessage(FileErrorCode.CANCELLED)
            }
          }
        }

        const filePath = result.filePaths[0]

        // Validate path
        if (!path.isAbsolute(filePath)) {
          return {
            success: false,
            error: {
              code: FileErrorCode.INVALID_PATH,
              message: createErrorMessage(FileErrorCode.INVALID_PATH, filePath)
            }
          }
        }

        // Read file
        const content = await fs.readFile(filePath, 'utf-8')

        console.log(`✓ File opened successfully: ${filePath}`)

        return {
          success: true,
          content,
          filePath
        }
      } catch (error: any) {
        const errorCode = mapErrorToFileErrorCode(error)
        const errorMessage = createErrorMessage(errorCode)

        console.error('Failed to open file:', error)

        return {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            originalError: error
          }
        }
      }
    }
  )

  console.log('✓ File IPC handlers registered')
}

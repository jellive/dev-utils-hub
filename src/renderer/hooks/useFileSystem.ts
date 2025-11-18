import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { FileErrorCode, type SaveFileResult, type OpenFileResult, type FileFilter } from '../../preload/index.d'

export interface UseFileSystemOptions {
  /** Custom success message for save operations */
  saveSuccessMessage?: string
  /** Custom success message for open operations */
  openSuccessMessage?: string
  /** Custom error message */
  errorMessage?: string
}

export interface UseFileSystemReturn {
  /** Save content to file */
  saveFile: (content: string, defaultFileName?: string, filters?: FileFilter[]) => Promise<SaveFileResult>
  /** Open and read file */
  openFile: (filters?: FileFilter[]) => Promise<OpenFileResult>
  /** Whether a save operation is in progress */
  isSaving: boolean
  /** Whether an open operation is in progress */
  isOpening: boolean
}

/**
 * React hook for file system operations
 */
export function useFileSystem(options: UseFileSystemOptions = {}): UseFileSystemReturn {
  const {
    saveSuccessMessage = '파일이 저장되었습니다',
    openSuccessMessage = '파일을 불러왔습니다',
    errorMessage = '파일 작업 실패'
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [isOpening, setIsOpening] = useState(false)

  // Save file
  const saveFile = useCallback(
    async (
      content: string,
      defaultFileName?: string,
      filters?: FileFilter[]
    ): Promise<SaveFileResult> => {
      if (!content) {
        console.warn('Cannot save empty content')
        toast.error('저장할 내용이 없습니다')
        return {
          success: false,
          error: {
            code: FileErrorCode.INVALID_PATH,
            message: '저장할 내용이 없습니다'
          }
        }
      }

      try {
        setIsSaving(true)

        if (window.api?.file) {
          // Use Electron file API
          const result = await window.api.file.save(content, defaultFileName, filters)

          if (result.success) {
            toast.success(saveSuccessMessage)
          } else if (result.error?.code !== 'CANCELLED') {
            // Don't show error toast for user cancellation
            toast.error(result.error?.message || errorMessage)
          }

          return result
        } else {
          // Fallback for web mode - use download
          const blob = new Blob([content], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = defaultFileName || 'untitled.txt'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          toast.success(saveSuccessMessage)

          return {
            success: true,
            filePath: defaultFileName
          }
        }
      } catch (error) {
        console.error('Failed to save file:', error)
        toast.error(errorMessage)

        return {
          success: false,
          error: {
            code: FileErrorCode.UNKNOWN_ERROR,
            message: errorMessage,
            originalError: error instanceof Error ? error : undefined
          }
        }
      } finally {
        setIsSaving(false)
      }
    },
    [saveSuccessMessage, errorMessage]
  )

  // Open file
  const openFile = useCallback(
    async (filters?: FileFilter[]): Promise<OpenFileResult> => {
      try {
        setIsOpening(true)

        if (window.api?.file) {
          // Use Electron file API
          const result = await window.api.file.open(filters)

          if (result.success) {
            toast.success(openSuccessMessage)
          } else if (result.error?.code !== 'CANCELLED') {
            // Don't show error toast for user cancellation
            toast.error(result.error?.message || errorMessage)
          }

          return result
        } else {
          // Fallback for web mode - use file input
          return new Promise((resolve) => {
            const input = document.createElement('input')
            input.type = 'file'
            if (filters && filters.length > 0) {
              const accept = filters
                .flatMap((f) => f.extensions.map((ext) => (ext === '*' ? '*' : `.${ext}`)))
                .join(',')
              input.accept = accept
            }

            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) {
                resolve({
                  success: false,
                  error: {
                    code: FileErrorCode.CANCELLED,
                    message: '파일 선택이 취소되었습니다'
                  }
                })
                return
              }

              try {
                const content = await file.text()
                toast.success(openSuccessMessage)

                resolve({
                  success: true,
                  content,
                  filePath: file.name
                })
              } catch (error) {
                toast.error(errorMessage)

                resolve({
                  success: false,
                  error: {
                    code: FileErrorCode.UNKNOWN_ERROR,
                    message: errorMessage,
                    originalError: error instanceof Error ? error : undefined
                  }
                })
              }
            }

            input.click()
          })
        }
      } catch (error) {
        console.error('Failed to open file:', error)
        toast.error(errorMessage)

        return {
          success: false,
          error: {
            code: FileErrorCode.UNKNOWN_ERROR,
            message: errorMessage,
            originalError: error instanceof Error ? error : undefined
          }
        }
      } finally {
        setIsOpening(false)
      }
    },
    [openSuccessMessage, errorMessage]
  )

  return {
    saveFile,
    openFile,
    isSaving,
    isOpening
  }
}

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/tauri-api';

// File error codes matching the Tauri API adapter
enum FileErrorCode {
  CANCELLED = 'CANCELLED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_PATH = 'INVALID_PATH',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface SaveFileResult {
  success: boolean;
  filePath?: string;
  error?: { code: string; message: string };
}

interface OpenFileResult {
  success: boolean;
  content?: string;
  filePath?: string;
  error?: { code: string; message: string };
}

interface FileFilter {
  name: string;
  extensions: string[];
}

export interface UseFileSystemOptions {
  /** Custom success message for export operations */
  exportSuccessMessage?: string;
  /** Custom success message for import operations */
  importSuccessMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

export interface UseFileSystemReturn {
  /** Export content to file */
  exportFile: (
    content: string,
    defaultFileName?: string,
    filters?: FileFilter[]
  ) => Promise<SaveFileResult>;
  /** Import and read file */
  importFile: (filters?: FileFilter[]) => Promise<OpenFileResult>;
  /** Whether an export operation is in progress */
  isExporting: boolean;
  /** Whether an import operation is in progress */
  isImporting: boolean;
}

/**
 * React hook for file system operations
 */
export function useFileSystem(options: UseFileSystemOptions = {}): UseFileSystemReturn {
  const {
    exportSuccessMessage = '파일이 내보내졌습니다',
    importSuccessMessage = '파일을 가져왔습니다',
    errorMessage = '파일 작업 실패',
  } = options;

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Export file
  const exportFile = useCallback(
    async (
      content: string,
      defaultFileName?: string,
      filters?: FileFilter[]
    ): Promise<SaveFileResult> => {
      if (!content) {
        console.warn('Cannot export empty content');
        toast.error('내보낼 내용이 없습니다');
        return {
          success: false,
          error: {
            code: FileErrorCode.INVALID_PATH,
            message: '내보낼 내용이 없습니다',
          },
        };
      }

      try {
        setIsExporting(true);

        if (api?.file) {
          // Use Electron file API
          const result = await api.file.save(content, defaultFileName, filters);

          if (result.success) {
            toast.success(exportSuccessMessage);
          } else if (result.error?.code !== 'CANCELLED') {
            // Don't show error toast for user cancellation
            toast.error(result.error?.message || errorMessage);
          }

          return result;
        } else {
          // Fallback for web mode - use download
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = defaultFileName || 'untitled.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast.success(exportSuccessMessage);

          return {
            success: true,
            filePath: defaultFileName,
          };
        }
      } catch (error) {
        console.error('Failed to export file:', error);
        toast.error(errorMessage);

        return {
          success: false,
          error: {
            code: FileErrorCode.UNKNOWN_ERROR,
            message: errorMessage,
          },
        };
      } finally {
        setIsExporting(false);
      }
    },
    [exportSuccessMessage, errorMessage]
  );

  // Import file
  const importFile = useCallback(
    async (filters?: FileFilter[]): Promise<OpenFileResult> => {
      try {
        setIsImporting(true);

        if (api?.file) {
          // Use Electron file API
          const result = await api.file.open(filters);

          if (result.success) {
            toast.success(importSuccessMessage);
          } else if (result.error?.code !== 'CANCELLED') {
            // Don't show error toast for user cancellation
            toast.error(result.error?.message || errorMessage);
          }

          return result;
        } else {
          // Fallback for web mode - use file input
          return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            if (filters && filters.length > 0) {
              const accept = filters
                .flatMap(f => f.extensions.map(ext => (ext === '*' ? '*' : `.${ext}`)))
                .join(',');
              input.accept = accept;
            }

            input.onchange = async e => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) {
                resolve({
                  success: false,
                  error: {
                    code: FileErrorCode.CANCELLED,
                    message: '파일 선택이 취소되었습니다',
                  },
                });
                return;
              }

              try {
                const content = await file.text();
                toast.success(importSuccessMessage);

                resolve({
                  success: true,
                  content,
                  filePath: file.name,
                });
              } catch (error) {
                toast.error(errorMessage);

                resolve({
                  success: false,
                  error: {
                    code: FileErrorCode.UNKNOWN_ERROR,
                    message: errorMessage,
                  },
                });
              }
            };

            input.click();
          });
        }
      } catch (error) {
        console.error('Failed to import file:', error);
        toast.error(errorMessage);

        return {
          success: false,
          error: {
            code: FileErrorCode.UNKNOWN_ERROR,
            message: errorMessage,
          },
        };
      } finally {
        setIsImporting(false);
      }
    },
    [importSuccessMessage, errorMessage]
  );

  return {
    exportFile,
    importFile,
    isExporting,
    isImporting,
  };
}

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/tauri-api';

export interface UseClipboardOptions {
  /** Duration to show success message (ms) */
  successDuration?: number;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

export interface UseClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Read text from clipboard */
  read: () => Promise<string | null>;
  /** Clear clipboard */
  clear: () => Promise<boolean>;
  /** Whether a copy operation is in progress */
  isCopying: boolean;
  /** Whether clipboard has been copied successfully recently */
  hasCopied: boolean;
}

/**
 * React hook for clipboard operations
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const {
    successDuration = 2000,
    successMessage = '클립보드에 복사되었습니다',
    errorMessage = '클립보드 복사 실패',
  } = options;

  const [isCopying, setIsCopying] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Copy text to clipboard
  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) {
        console.warn('Cannot copy empty text to clipboard');
        return false;
      }

      try {
        setIsCopying(true);

        if (api?.clipboard) {
          // Use Electron clipboard API
          await api.clipboard.writeText(text);
        } else {
          // Fallback to web clipboard API
          await navigator.clipboard.writeText(text);
        }

        setHasCopied(true);

        // Show success toast
        toast.success(successMessage);

        // Reset hasCopied flag after duration
        setTimeout(() => {
          setHasCopied(false);
        }, successDuration);

        return true;
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);

        // Show error toast
        toast.error(errorMessage);

        return false;
      } finally {
        setIsCopying(false);
      }
    },
    [successMessage, errorMessage, successDuration]
  );

  // Read text from clipboard
  const read = useCallback(async (): Promise<string | null> => {
    try {
      if (api?.clipboard) {
        // Use Electron clipboard API
        return await api.clipboard.readText();
      } else {
        // Fallback to web clipboard API
        return await navigator.clipboard.readText();
      }
    } catch (error) {
      console.error('Failed to read from clipboard:', error);
      return null;
    }
  }, []);

  // Clear clipboard
  const clear = useCallback(async (): Promise<boolean> => {
    try {
      if (api?.clipboard) {
        // Use Electron clipboard API
        return await api.clipboard.clear();
      } else {
        // Fallback: write empty string
        await navigator.clipboard.writeText('');
        return true;
      }
    } catch (error) {
      console.error('Failed to clear clipboard:', error);
      return false;
    }
  }, []);

  return {
    copy,
    read,
    clear,
    isCopying,
    hasCopied,
  };
}

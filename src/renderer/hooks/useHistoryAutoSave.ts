import { useCallback, useRef, useEffect } from 'react';
import { api } from '../lib/tauri-api';

export interface UseHistoryAutoSaveOptions {
  /** Tool name for categorizing history */
  tool: string;
  /** Delay in milliseconds before saving (default: 1000ms) */
  delay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for auto-saving history entries with debouncing
 *
 * Features:
 * - Debounces save operations to prevent excessive saves
 * - Validates input before saving (no empty inputs)
 * - Graceful error handling
 * - Can be disabled via enabled option
 *
 * @example
 * const saveToHistory = useHistoryAutoSave({ tool: 'json', delay: 1000 })
 *
 * // In your component
 * useEffect(() => {
 *   if (output) {
 *     saveToHistory(input, output)
 *   }
 * }, [output, input, saveToHistory])
 */
export function useHistoryAutoSave(options: UseHistoryAutoSaveOptions) {
  const { tool, delay = 1000, enabled = true } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const saveToHistory = useCallback(
    (input: string, output?: string, metadata?: Record<string, any>) => {
      // Skip if disabled or no input
      if (!enabled || !input || !input.trim()) {
        return;
      }

      // Clear any pending save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the save operation
      timeoutRef.current = setTimeout(async () => {
        try {
          if (api?.history) {
            await api.history.save(tool, input, output, metadata);
          }
        } catch (error) {
          console.error('Failed to save history:', error);
          // Fail silently - don't interrupt user workflow
        }
      }, delay);
    },
    [tool, delay, enabled]
  );

  return saveToHistory;
}

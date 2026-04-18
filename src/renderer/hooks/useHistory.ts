import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { api, type HistoryEntry } from '../lib/tauri-api';

interface HistoryStats {
  total: number;
  by_tool: Record<string, number>;
  favorites: number;
  oldest_entry: number | null;
  newest_entry: number | null;
}

export interface UseHistoryOptions {
  tool?: string;
  limit?: number;
  autoLoad?: boolean;
}

export interface UseHistoryReturn {
  // State
  history: HistoryEntry[];
  isLoading: boolean;
  error: string | null;
  stats: HistoryStats | null;

  // Operations
  saveHistory: (
    tool: string,
    input: string,
    output?: string,
    metadata?: Record<string, unknown>
  ) => Promise<number | null>;
  loadHistory: (tool?: string, limit?: number) => Promise<void>;
  searchHistory: (tool: string, query: string, limit?: number) => Promise<HistoryEntry[]>;
  deleteHistory: (id: number) => Promise<boolean>;
  toggleFavorite: (id: number) => Promise<boolean>;
  clearHistory: (tool: string) => Promise<boolean>;
  clearAllHistory: () => Promise<boolean>;
  getHistoryById: (id: number) => Promise<HistoryEntry | undefined>;
  loadStats: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * React hook for managing history database operations
 */
export function useHistory(options: UseHistoryOptions = {}): UseHistoryReturn {
  const { tool, limit = 50, autoLoad = false } = options;

  // State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<HistoryStats | null>(null);

  // Debounce timer ref
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save history entry
  const saveHistory = useCallback(
    async (
      tool: string,
      input: string,
      output?: string,
      metadata?: Record<string, unknown>
    ): Promise<number | null> => {
      try {
        setError(null);
        const id = await api.history.save(tool, input, output, metadata);

        // Optimistically add to local state
        const newEntry: HistoryEntry = {
          id,
          tool,
          input,
          output: output ?? null,
          metadata: metadata ? JSON.stringify(metadata) : null,
          favorite: 0,
          created_at: Date.now(),
        };

        setHistory(prev => [newEntry, ...prev]);
        return id;
      } catch (err: unknown) {
        const errorMessage = `Failed to save history: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, err);
        return null;
      }
    },
    []
  );

  // Load history entries
  const loadHistory = useCallback(
    async (toolFilter?: string, limitCount?: number): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const entries = (await api?.history?.get(toolFilter, limitCount || limit)) ?? [];
        setHistory(entries);
      } catch (err: unknown) {
        const errorMessage = `Failed to load history: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  // Search history with debouncing
  const searchHistory = useCallback(
    async (tool: string, query: string, searchLimit?: number): Promise<HistoryEntry[]> => {
      return new Promise((resolve, reject) => {
        // Clear previous timer
        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current);
        }

        // Debounce search for 300ms
        searchTimerRef.current = setTimeout(async () => {
          try {
            setIsLoading(true);
            setError(null);

            const results = await api.history.search(tool, query, searchLimit || limit);
            setHistory(results);
            resolve(results);
          } catch (err: unknown) {
            const errorMessage = `Failed to search history: ${err instanceof Error ? err.message : 'Unknown error'}`;
            setError(errorMessage);
            console.error(errorMessage, err);
            reject(err);
          } finally {
            setIsLoading(false);
          }
        }, 300);
      });
    },
    [limit]
  );

  // Delete history entry with optimistic update
  const deleteHistory = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        // Optimistic update
        setHistory(prev => prev.filter(entry => entry.id !== id));

        const success = await api.history.delete(id);

        if (!success) {
          // Revert on failure
          await loadHistory(tool, limit);
          throw new Error('Failed to delete history entry');
        }

        return true;
      } catch (err: unknown) {
        const errorMessage = `Failed to delete history: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, err);
        return false;
      }
    },
    [tool, limit, loadHistory]
  );

  // Toggle favorite with optimistic update
  const toggleFavorite = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        setError(null);

        // Optimistic update
        setHistory(prev =>
          prev.map(entry =>
            entry.id === id ? { ...entry, favorite: entry.favorite === 1 ? 0 : 1 } : entry
          )
        );

        const success = await api.history.toggleFavorite(id);

        if (!success) {
          // Revert on failure
          await loadHistory(tool, limit);
          throw new Error('Failed to toggle favorite');
        }

        return true;
      } catch (err: unknown) {
        const errorMessage = `Failed to toggle favorite: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        console.error(errorMessage, err);
        return false;
      }
    },
    [tool, limit, loadHistory]
  );

  // Clear history for tool
  const clearHistory = useCallback(async (toolName: string): Promise<boolean> => {
    try {
      setError(null);
      const count = await api.history.clear(toolName);

      // Update local state
      setHistory(prev => prev.filter(entry => entry.tool !== toolName));

      console.log(`Cleared ${count} entries for tool: ${toolName}`);
      return true;
    } catch (err: unknown) {
      const errorMessage = `Failed to clear history: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error(errorMessage, err);
      return false;
    }
  }, []);

  // Clear all history
  const clearAllHistory = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const count = await api.history.clearAll();

      // Clear local state
      setHistory([]);

      console.log(`Cleared all history: ${count} entries`);
      return true;
    } catch (err: unknown) {
      const errorMessage = `Failed to clear all history: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error(errorMessage, err);
      return false;
    }
  }, []);

  // Get history entry by ID
  const getHistoryById = useCallback(async (id: number): Promise<HistoryEntry | undefined> => {
    try {
      setError(null);
      const entry = await api.history.getById(id);
      return entry ?? undefined;
    } catch (err: unknown) {
      const errorMessage = `Failed to get history entry: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error(errorMessage, err);
      return undefined;
    }
  }, []);

  // Load statistics
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const statistics = await api.history.stats();
      setStats(statistics);
    } catch (err: unknown) {
      const errorMessage = `Failed to load statistics: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error(errorMessage, err);
    }
  }, []);

  // Refresh current view
  const refresh = useCallback(async (): Promise<void> => {
    await loadHistory(tool, limit);
  }, [tool, limit, loadHistory]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadHistory(tool, limit);
    }
  }, [autoLoad, tool, limit, loadHistory]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Memoize return object
  return useMemo(
    () => ({
      history,
      isLoading,
      error,
      stats,
      saveHistory,
      loadHistory,
      searchHistory,
      deleteHistory,
      toggleFavorite,
      clearHistory,
      clearAllHistory,
      getHistoryById,
      loadStats,
      refresh,
    }),
    [
      history,
      isLoading,
      error,
      stats,
      saveHistory,
      loadHistory,
      searchHistory,
      deleteHistory,
      toggleFavorite,
      clearHistory,
      clearAllHistory,
      getHistoryById,
      loadStats,
      refresh,
    ]
  );
}

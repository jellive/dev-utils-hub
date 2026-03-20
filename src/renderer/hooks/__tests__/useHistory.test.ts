import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '../useHistory';
import type { HistoryEntry, HistoryStats } from '../../../preload/index.d';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 1,
    tool: 'test',
    input: 'input',
    output: 'output',
    metadata: undefined,
    favorite: 0,
    created_at: 1700000000,
    ...overrides,
  };
}

const mockApi = {
  history: {
    save: vi.fn(),
    get: vi.fn(),
    search: vi.fn(),
    delete: vi.fn(),
    toggleFavorite: vi.fn(),
    clear: vi.fn(),
    clearAll: vi.fn(),
    getById: vi.fn(),
    stats: vi.fn(),
    count: vi.fn(),
  },
};

beforeEach(() => {
  // @ts-ignore
  window.api = mockApi;
  vi.clearAllMocks();
});

afterEach(() => {
  // @ts-ignore
  delete window.api;
  vi.useRealTimers();
});

describe('useHistory', () => {
  describe('initial state', () => {
    it('starts with empty history, not loading, no error', () => {
      const { result } = renderHook(() => useHistory());
      expect(result.current.history).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toBeNull();
    });

    it('auto-loads when autoLoad=true', async () => {
      const entries = [makeEntry()];
      mockApi.history.get.mockResolvedValue(entries);

      const { result } = renderHook(() => useHistory({ tool: 'test', autoLoad: true }));
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.history).toEqual(entries);
      expect(mockApi.history.get).toHaveBeenCalledWith('test', 50);
    });

    it('does not auto-load when autoLoad=false', async () => {
      const { result } = renderHook(() => useHistory({ autoLoad: false }));
      // Give it a tick to ensure no load happened
      await act(async () => {});
      expect(mockApi.history.get).not.toHaveBeenCalled();
      expect(result.current.history).toEqual([]);
    });
  });

  describe('saveHistory', () => {
    it('saves entry and adds it to local state optimistically', async () => {
      mockApi.history.save.mockResolvedValue(42);
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        const id = await result.current.saveHistory('test', 'input', 'output');
        expect(id).toBe(42);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].id).toBe(42);
      expect(result.current.history[0].input).toBe('input');
    });

    it('sets error and returns null when save fails', async () => {
      mockApi.history.save.mockRejectedValue(new Error('DB error'));
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        const id = await result.current.saveHistory('test', 'input');
        expect(id).toBeNull();
      });

      expect(result.current.error).toContain('Failed to save history');
    });

    it('includes metadata in optimistic entry', async () => {
      mockApi.history.save.mockResolvedValue(1);
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.saveHistory('test', 'in', 'out', { unit: 'ms' });
      });

      expect(result.current.history[0].metadata).toBe(JSON.stringify({ unit: 'ms' }));
    });
  });

  describe('loadHistory', () => {
    it('loads history and sets state', async () => {
      const entries = [makeEntry({ id: 1 }), makeEntry({ id: 2 })];
      mockApi.history.get.mockResolvedValue(entries);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory('test');
      });

      expect(result.current.history).toEqual(entries);
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error when load fails', async () => {
      mockApi.history.get.mockRejectedValue(new Error('load error'));
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.loadHistory('test');
      });

      expect(result.current.error).toContain('Failed to load history');
    });

    it('uses default limit of 50', async () => {
      mockApi.history.get.mockResolvedValue([]);
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.loadHistory('test');
      });

      expect(mockApi.history.get).toHaveBeenCalledWith('test', 50);
    });
  });

  describe('deleteHistory', () => {
    it('removes entry from state optimistically and calls api', async () => {
      const entries = [makeEntry({ id: 1 }), makeEntry({ id: 2, input: 'b' })];
      mockApi.history.get.mockResolvedValue(entries);
      mockApi.history.delete.mockResolvedValue(true);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory();
      });

      await act(async () => {
        const success = await result.current.deleteHistory(1);
        expect(success).toBe(true);
      });

      expect(result.current.history.find(e => e.id === 1)).toBeUndefined();
      expect(result.current.history).toHaveLength(1);
    });

    it('returns false and sets error when api fails', async () => {
      mockApi.history.get.mockResolvedValue([makeEntry({ id: 1 })]);
      mockApi.history.delete.mockResolvedValue(false);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory();
      });

      // second get call for revert
      mockApi.history.get.mockResolvedValue([makeEntry({ id: 1 })]);

      await act(async () => {
        const success = await result.current.deleteHistory(1);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Failed to delete');
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite flag optimistically', async () => {
      const entry = makeEntry({ id: 1, favorite: 0 });
      mockApi.history.get.mockResolvedValue([entry]);
      mockApi.history.toggleFavorite.mockResolvedValue(true);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory();
      });

      await act(async () => {
        await result.current.toggleFavorite(1);
      });

      expect(result.current.history[0].favorite).toBe(1);
    });

    it('returns false and sets error when toggle fails', async () => {
      mockApi.history.get.mockResolvedValue([makeEntry({ id: 1 })]);
      mockApi.history.toggleFavorite.mockResolvedValue(false);
      // For revert reload
      mockApi.history.get.mockResolvedValueOnce([makeEntry({ id: 1 })]).mockResolvedValueOnce([makeEntry({ id: 1 })]);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory();
      });

      await act(async () => {
        const success = await result.current.toggleFavorite(1);
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Failed to toggle');
    });
  });

  describe('clearHistory', () => {
    it('removes entries for the tool from state', async () => {
      const entries = [
        makeEntry({ id: 1, tool: 'tool-a' }),
        makeEntry({ id: 2, tool: 'tool-b' }),
      ];
      mockApi.history.get.mockResolvedValue(entries);
      mockApi.history.clear.mockResolvedValue(1);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory();
      });

      await act(async () => {
        const success = await result.current.clearHistory('tool-a');
        expect(success).toBe(true);
      });

      expect(result.current.history.find(e => e.tool === 'tool-a')).toBeUndefined();
      expect(result.current.history).toHaveLength(1);
    });

    it('returns false and sets error on failure', async () => {
      mockApi.history.clear.mockRejectedValue(new Error('clear error'));
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        const success = await result.current.clearHistory('tool-a');
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Failed to clear history');
    });
  });

  describe('clearAllHistory', () => {
    it('clears all entries from state', async () => {
      const entries = [makeEntry({ id: 1 }), makeEntry({ id: 2 })];
      mockApi.history.get.mockResolvedValue(entries);
      mockApi.history.clearAll.mockResolvedValue(2);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadHistory();
      });

      await act(async () => {
        const success = await result.current.clearAllHistory();
        expect(success).toBe(true);
      });

      expect(result.current.history).toEqual([]);
    });

    it('returns false and sets error on failure', async () => {
      mockApi.history.clearAll.mockRejectedValue(new Error('clearAll error'));
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        const success = await result.current.clearAllHistory();
        expect(success).toBe(false);
      });

      expect(result.current.error).toContain('Failed to clear all history');
    });
  });

  describe('getHistoryById', () => {
    it('returns entry by id', async () => {
      const entry = makeEntry({ id: 99 });
      mockApi.history.getById.mockResolvedValue(entry);

      const { result } = renderHook(() => useHistory());
      let found: HistoryEntry | undefined;
      await act(async () => {
        found = await result.current.getHistoryById(99);
      });

      expect(found).toEqual(entry);
    });

    it('returns undefined and sets error on failure', async () => {
      mockApi.history.getById.mockRejectedValue(new Error('not found'));
      const { result } = renderHook(() => useHistory());

      let found: HistoryEntry | undefined;
      await act(async () => {
        found = await result.current.getHistoryById(999);
      });

      expect(found).toBeUndefined();
      expect(result.current.error).toContain('Failed to get history entry');
    });
  });

  describe('loadStats', () => {
    it('loads and sets stats', async () => {
      const stats: HistoryStats = { total: 10, by_tool: {}, favorites: 2 };
      mockApi.history.stats.mockResolvedValue(stats);

      const { result } = renderHook(() => useHistory());
      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.stats).toEqual(stats);
    });

    it('sets error on failure', async () => {
      mockApi.history.stats.mockRejectedValue(new Error('stats error'));
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.loadStats();
      });

      expect(result.current.error).toContain('Failed to load statistics');
    });
  });

  describe('refresh', () => {
    it('calls loadHistory with current tool and limit', async () => {
      mockApi.history.get.mockResolvedValue([]);
      const { result } = renderHook(() => useHistory({ tool: 'mytool', limit: 25 }));

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockApi.history.get).toHaveBeenCalledWith('mytool', 25);
    });
  });
});

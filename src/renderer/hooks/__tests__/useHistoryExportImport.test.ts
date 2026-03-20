import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryExportImport } from '../useHistoryExportImport';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

const mockHistoryGet = vi.fn();
const mockHistorySave = vi.fn();
const mockHistoryClear = vi.fn();
const mockFileSave = vi.fn();
const mockFileOpen = vi.fn();

function setupWindowApi() {
  // @ts-ignore
  window.api = {
    history: {
      get: mockHistoryGet,
      save: mockHistorySave,
      clear: mockHistoryClear,
    },
    file: {
      save: mockFileSave,
      open: mockFileOpen,
    },
  };
}

const defaultOptions = {
  tool: 'uuid',
  toolDisplayName: 'UUID Generator',
};

beforeEach(() => {
  vi.clearAllMocks();
  setupWindowApi();
});

afterEach(() => {
  // @ts-ignore
  delete window.api;
});

describe('useHistoryExportImport', () => {
  describe('initial state', () => {
    it('starts with all loading states false', () => {
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      expect(result.current.isExporting).toBe(false);
      expect(result.current.isImporting).toBe(false);
    });

    it('starts with all dialog states false', () => {
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      expect(result.current.showExportDialog).toBe(false);
      expect(result.current.showImportDialog).toBe(false);
    });

    it('exposes setShowExportDialog and setShowImportDialog functions', () => {
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      expect(typeof result.current.setShowExportDialog).toBe('function');
      expect(typeof result.current.setShowImportDialog).toBe('function');
    });

    it('toggles showExportDialog via setShowExportDialog', () => {
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      act(() => result.current.setShowExportDialog(true));
      expect(result.current.showExportDialog).toBe(true);
      act(() => result.current.setShowExportDialog(false));
      expect(result.current.showExportDialog).toBe(false);
    });

    it('toggles showImportDialog via setShowImportDialog', () => {
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      act(() => result.current.setShowImportDialog(true));
      expect(result.current.showImportDialog).toBe(true);
    });
  });

  describe('handleExport', () => {
    it('shows error toast when window.api.history is missing', async () => {
      // @ts-ignore
      delete window.api.history;
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'json', includeMetadata: false });
      });
      expect(toast.error).toHaveBeenCalled();
      expect(mockFileSave).not.toHaveBeenCalled();
    });

    it('shows error toast when window.api.file is missing', async () => {
      // @ts-ignore
      delete window.api.file;
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'json', includeMetadata: false });
      });
      expect(toast.error).toHaveBeenCalled();
      expect(mockHistoryGet).not.toHaveBeenCalled();
    });

    it('shows error toast when no entries to export', async () => {
      mockHistoryGet.mockResolvedValue([]);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'json', includeMetadata: false });
      });
      expect(toast.error).toHaveBeenCalled();
      expect(mockFileSave).not.toHaveBeenCalled();
    });

    it('calls history.get with tool and count when count is a number', async () => {
      mockHistoryGet.mockResolvedValue([{ input: 'a', output: 'b', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockFileSave.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 10, format: 'json', includeMetadata: false });
      });
      expect(mockHistoryGet).toHaveBeenCalledWith('uuid', 10);
    });

    it('calls history.get with only tool when count is "all"', async () => {
      mockHistoryGet.mockResolvedValue([{ input: 'a', output: 'b', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockFileSave.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'txt', includeMetadata: false });
      });
      expect(mockHistoryGet).toHaveBeenCalledWith('uuid');
    });

    it('shows success toast and closes dialog on successful export', async () => {
      mockHistoryGet.mockResolvedValue([{ input: 'a', output: 'b', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockFileSave.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      act(() => result.current.setShowExportDialog(true));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'json', includeMetadata: true });
      });
      expect(toast.success).toHaveBeenCalled();
      expect(result.current.showExportDialog).toBe(false);
      expect(result.current.isExporting).toBe(false);
    });

    it('does not show success toast when file save was cancelled', async () => {
      mockHistoryGet.mockResolvedValue([{ input: 'a', output: 'b', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockFileSave.mockResolvedValue({ success: false, error: { code: 'CANCELLED' } });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'json', includeMetadata: false });
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('shows error toast when file save fails with non-cancel error', async () => {
      mockHistoryGet.mockResolvedValue([{ input: 'a', output: 'b', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockFileSave.mockResolvedValue({ success: false, error: { code: 'WRITE_ERROR', message: 'Disk full' } });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'json', includeMetadata: false });
      });
      expect(toast.error).toHaveBeenCalled();
    });

    it('isExporting is false after export completes', async () => {
      mockHistoryGet.mockResolvedValue([{ input: 'a', output: 'b', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockFileSave.mockResolvedValue({ success: true });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleExport({ count: 'all', format: 'csv', includeMetadata: false });
      });
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('handleImport', () => {
    it('shows error toast when window.api.history is missing', async () => {
      // @ts-ignore
      delete window.api.history;
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(toast.error).toHaveBeenCalled();
    });

    it('shows error toast when window.api.file is missing', async () => {
      // @ts-ignore
      delete window.api.file;
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(toast.error).toHaveBeenCalled();
    });

    it('returns early without error when file open is cancelled', async () => {
      mockFileOpen.mockResolvedValue({ success: false, error: { code: 'CANCELLED' } });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('imports JSON file and saves each entry', async () => {
      const jsonContent = JSON.stringify([{ input: 'hello', output: 'world' }]);
      mockFileOpen.mockResolvedValue({
        success: true,
        content: jsonContent,
        filePath: 'export.json',
      });
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(mockHistorySave).toHaveBeenCalledWith('uuid', 'hello', 'world');
      expect(toast.success).toHaveBeenCalled();
      expect(result.current.showImportDialog).toBe(false);
    });

    it('imports CSV file correctly', async () => {
      const csvContent = 'input,output\nhello,world\nfoo,bar';
      mockFileOpen.mockResolvedValue({
        success: true,
        content: csvContent,
        filePath: 'export.csv',
      });
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(mockHistorySave).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalled();
    });

    it('imports TXT file correctly', async () => {
      const txtContent = 'line one\nline two\nline three';
      mockFileOpen.mockResolvedValue({
        success: true,
        content: txtContent,
        filePath: 'export.txt',
      });
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(mockHistorySave).toHaveBeenCalledTimes(3);
    });

    it('clears existing history when replaceExisting=true', async () => {
      const jsonContent = JSON.stringify([{ input: 'x' }]);
      mockFileOpen.mockResolvedValue({
        success: true,
        content: jsonContent,
        filePath: 'export.json',
      });
      mockHistoryClear.mockResolvedValue(undefined);
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: true });
      });
      expect(mockHistoryClear).toHaveBeenCalledWith('uuid');
    });

    it('skips duplicate entries when skipDuplicates=true', async () => {
      const jsonContent = JSON.stringify([{ input: 'existing' }, { input: 'new' }]);
      mockFileOpen.mockResolvedValue({
        success: true,
        content: jsonContent,
        filePath: 'export.json',
      });
      mockHistoryGet.mockResolvedValue([{ input: 'existing', tool: 'uuid', timestamp: Date.now(), id: 1 }]);
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: true, replaceExisting: false });
      });
      // Only 'new' should be saved, 'existing' skipped
      expect(mockHistorySave).toHaveBeenCalledTimes(1);
      expect(mockHistorySave).toHaveBeenCalledWith('uuid', 'new', undefined);
    });

    it('shows error toast when no data in file', async () => {
      mockFileOpen.mockResolvedValue({
        success: true,
        content: '[]',
        filePath: 'export.json',
      });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(toast.error).toHaveBeenCalled();
      expect(mockHistorySave).not.toHaveBeenCalled();
    });

    it('shows error toast when JSON is invalid', async () => {
      mockFileOpen.mockResolvedValue({
        success: true,
        content: 'not json at all',
        filePath: 'export.json',
      });
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(toast.error).toHaveBeenCalled();
    });

    it('isImporting is false after import completes', async () => {
      const jsonContent = JSON.stringify([{ input: 'a' }]);
      mockFileOpen.mockResolvedValue({
        success: true,
        content: jsonContent,
        filePath: 'export.json',
      });
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() => useHistoryExportImport(defaultOptions));
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(result.current.isImporting).toBe(false);
    });

    it('uses custom parseImportData when provided', async () => {
      const customParser = vi.fn().mockReturnValue([{ input: 'custom', output: 'parsed' }]);
      mockFileOpen.mockResolvedValue({
        success: true,
        content: 'raw content',
        filePath: 'export.txt',
      });
      mockHistorySave.mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useHistoryExportImport({ ...defaultOptions, parseImportData: customParser })
      );
      await act(async () => {
        await result.current.handleImport({ skipDuplicates: false, replaceExisting: false });
      });
      expect(customParser).toHaveBeenCalledWith('raw content', 'txt');
      expect(mockHistorySave).toHaveBeenCalledWith('uuid', 'custom', 'parsed');
    });
  });
});

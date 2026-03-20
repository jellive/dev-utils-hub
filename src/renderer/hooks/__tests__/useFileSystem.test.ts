import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileSystem } from '../useFileSystem';

beforeEach(() => {
  // @ts-ignore
  delete window.api;

  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to make a real anchor element and intercept click
function mockAnchorClick() {
  const anchor = document.createElement('a');
  const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return anchor;
    // Use the original (bound) function for other tags to avoid recursion
    return origCreate(tag as any);
  });
  return { anchor, clickSpy };
}

// Helper to make a real input element and simulate file selection
function mockFileInput() {
  const input = document.createElement('input');
  const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'input') return input;
    return origCreate(tag as any);
  });
  return { input, clickSpy };
}

describe('useFileSystem', () => {
  describe('initial state', () => {
    it('starts with isExporting=false and isImporting=false', () => {
      const { result } = renderHook(() => useFileSystem());
      expect(result.current.isExporting).toBe(false);
      expect(result.current.isImporting).toBe(false);
    });
  });

  describe('exportFile (web fallback)', () => {
    it('returns failure for empty content', async () => {
      const { result } = renderHook(() => useFileSystem());
      let exportResult: any;

      await act(async () => {
        exportResult = await result.current.exportFile('');
      });

      expect(exportResult.success).toBe(false);
    });

    it('returns success and triggers download for non-empty content', async () => {
      const { anchor, clickSpy } = mockAnchorClick();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

      const { result } = renderHook(() => useFileSystem());
      let exportResult: any;

      await act(async () => {
        exportResult = await result.current.exportFile('hello world', 'test.txt');
      });

      expect(exportResult.success).toBe(true);
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('sets download filename from defaultFileName', async () => {
      const { anchor, clickSpy } = mockAnchorClick();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

      const { result } = renderHook(() => useFileSystem());
      await act(async () => {
        await result.current.exportFile('content', 'my-file.json');
      });

      expect(anchor.download).toBe('my-file.json');

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('isExporting is false after export completes', async () => {
      const { anchor } = mockAnchorClick();
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => anchor);

      const { result } = renderHook(() => useFileSystem());
      await act(async () => {
        await result.current.exportFile('data', 'file.txt');
      });

      expect(result.current.isExporting).toBe(false);

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });

  describe('importFile (web fallback)', () => {
    it('creates a file input and triggers click', async () => {
      const { input, clickSpy } = mockFileInput();

      const { result } = renderHook(() => useFileSystem());

      let importPromise: Promise<any>;
      act(() => {
        importPromise = result.current.importFile();
      });

      // Simulate user selecting a file via the onchange event
      const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        // Trigger onchange with the mock file
        const changeEvent = new Event('change');
        Object.defineProperty(changeEvent, 'target', {
          value: { files: [mockFile] },
        });
        await input.onchange?.(changeEvent as any);
      });

      expect(clickSpy).toHaveBeenCalled();
    });

    it('sets file input accept from filters', async () => {
      const { input } = mockFileInput();

      const { result } = renderHook(() => useFileSystem());
      act(() => {
        result.current.importFile([{ name: 'JSON files', extensions: ['json', 'txt'] }]);
      });

      expect(input.accept).toBe('.json,.txt');
    });
  });
});

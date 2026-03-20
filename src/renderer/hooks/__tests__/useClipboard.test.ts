import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

beforeEach(() => {
  // @ts-ignore
  delete window.api;

  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('clipboard content'),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useClipboard', () => {
  describe('initial state', () => {
    it('starts with isCopying=false and hasCopied=false', () => {
      const { result } = renderHook(() => useClipboard());
      expect(result.current.isCopying).toBe(false);
      expect(result.current.hasCopied).toBe(false);
    });
  });

  describe('copy', () => {
    it('calls navigator.clipboard.writeText with provided text', async () => {
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        const success = await result.current.copy('hello world');
        expect(success).toBe(true);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
    });

    it('sets hasCopied=true after successful copy', async () => {
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        await result.current.copy('test');
      });
      expect(result.current.hasCopied).toBe(true);
    });

    it('returns false and does not call clipboard for empty string', async () => {
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        const success = await result.current.copy('');
        expect(success).toBe(false);
      });
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('returns false when clipboard throws', async () => {
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('denied'));
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        const success = await result.current.copy('text');
        expect(success).toBe(false);
      });
      expect(result.current.hasCopied).toBe(false);
    });

    it('isCopying is false after copy completes', async () => {
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        await result.current.copy('text');
      });
      expect(result.current.isCopying).toBe(false);
    });
  });

  describe('read', () => {
    it('returns clipboard text via navigator.clipboard.readText', async () => {
      const { result } = renderHook(() => useClipboard());
      let text: string | null = null;
      await act(async () => {
        text = await result.current.read();
      });
      expect(text).toBe('clipboard content');
    });

    it('returns null when readText throws', async () => {
      (navigator.clipboard.readText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no permission'));
      const { result } = renderHook(() => useClipboard());
      let text: string | null = 'initial';
      await act(async () => {
        text = await result.current.read();
      });
      expect(text).toBeNull();
    });
  });

  describe('clear', () => {
    it('writes empty string to clipboard', async () => {
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        const success = await result.current.clear();
        expect(success).toBe(true);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('');
    });

    it('returns false when clear throws', async () => {
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
      const { result } = renderHook(() => useClipboard());
      await act(async () => {
        const success = await result.current.clear();
        expect(success).toBe(false);
      });
    });
  });
});

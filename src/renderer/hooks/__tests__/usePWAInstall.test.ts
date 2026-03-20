import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from '../usePWAInstall';

beforeEach(() => {
  // Ensure standalone mode is false by default
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue({ matches: false }),
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePWAInstall', () => {
  describe('initial state', () => {
    it('starts with canInstall=false and isInstalled=false', () => {
      const { result } = renderHook(() => usePWAInstall());
      expect(result.current.canInstall).toBe(false);
      expect(result.current.isInstalled).toBe(false);
    });

    it('returns installPWA function', () => {
      const { result } = renderHook(() => usePWAInstall());
      expect(typeof result.current.installPWA).toBe('function');
    });
  });

  describe('standalone mode detection', () => {
    it('sets isInstalled=true when already in standalone mode', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockReturnValue({ matches: true }),
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => usePWAInstall());
      expect(result.current.isInstalled).toBe(true);
    });
  });

  describe('beforeinstallprompt event', () => {
    it('sets canInstall=true when beforeinstallprompt fires', () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockPromptEvent = new Event('beforeinstallprompt');
      Object.assign(mockPromptEvent, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        window.dispatchEvent(mockPromptEvent);
      });

      expect(result.current.canInstall).toBe(true);
    });
  });

  describe('appinstalled event', () => {
    it('sets isInstalled=true when appinstalled fires', () => {
      const { result } = renderHook(() => usePWAInstall());

      act(() => {
        window.dispatchEvent(new Event('appinstalled'));
      });

      expect(result.current.isInstalled).toBe(true);
      expect(result.current.canInstall).toBe(false);
    });
  });

  describe('installPWA', () => {
    it('does nothing when no deferred prompt is available', async () => {
      const { result } = renderHook(() => usePWAInstall());

      // Should not throw when called with no deferredPrompt
      await act(async () => {
        await result.current.installPWA();
      });

      expect(result.current.canInstall).toBe(false);
    });

    it('calls prompt() and resets when user accepts', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const mockPromptEvent = new Event('beforeinstallprompt');
      Object.assign(mockPromptEvent, {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      });

      act(() => {
        window.dispatchEvent(mockPromptEvent);
      });

      expect(result.current.canInstall).toBe(true);

      await act(async () => {
        await result.current.installPWA();
      });

      expect(mockPrompt).toHaveBeenCalled();
      // After accepting, deferredPrompt is cleared → canInstall=false
      expect(result.current.canInstall).toBe(false);
    });

    it('keeps deferredPrompt when user dismisses', async () => {
      const { result } = renderHook(() => usePWAInstall());

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const mockPromptEvent = new Event('beforeinstallprompt');
      Object.assign(mockPromptEvent, {
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      });

      act(() => {
        window.dispatchEvent(mockPromptEvent);
      });

      await act(async () => {
        await result.current.installPWA();
      });

      expect(mockPrompt).toHaveBeenCalled();
      // Dismissed — deferredPrompt not cleared
      expect(result.current.canInstall).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => usePWAInstall());
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'appinstalled',
        expect.any(Function)
      );
    });
  });
});

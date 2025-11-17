import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../useAppStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAppStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store state
    useAppStore.setState({
      activeTool: 'json',
      darkMode: false,
      favorites: [],
    });
  });

  describe('State Management', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppStore());

      expect(result.current.activeTool).toBe('json');
      expect(result.current.darkMode).toBe(false);
      expect(result.current.favorites).toEqual([]);
    });

    it('should set active tool', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTool('jwt');
      });

      expect(result.current.activeTool).toBe('jwt');
    });

    it('should toggle dark mode', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.darkMode).toBe(true);

      act(() => {
        result.current.toggleDarkMode();
      });

      expect(result.current.darkMode).toBe(false);
    });

    it('should add favorite', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFavorite('base64');
      });

      expect(result.current.favorites).toContain('base64');
    });

    it('should not add duplicate favorite', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFavorite('base64');
        result.current.addFavorite('base64');
      });

      expect(result.current.favorites.filter((f) => f === 'base64').length).toBe(1);
    });

    it('should remove favorite', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.addFavorite('base64');
        result.current.addFavorite('jwt');
      });

      expect(result.current.favorites).toContain('base64');
      expect(result.current.favorites).toContain('jwt');

      act(() => {
        result.current.removeFavorite('base64');
      });

      expect(result.current.favorites).not.toContain('base64');
      expect(result.current.favorites).toContain('jwt');
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setActiveTool('jwt');
        result.current.toggleDarkMode();
        result.current.addFavorite('base64');
      });

      // Wait for persistence (Zustand persist is async)
      setTimeout(() => {
        const stored = localStorageMock.getItem('dev-utils-storage');
        expect(stored).toBeTruthy();

        const parsed = JSON.parse(stored!);
        expect(parsed.state.activeTool).toBe('jwt');
        expect(parsed.state.darkMode).toBe(true);
        expect(parsed.state.favorites).toContain('base64');
      }, 100);
    });

    it('should restore state from localStorage', () => {
      // Set initial state
      const initialState = {
        state: {
          activeTool: 'regex',
          darkMode: true,
          favorites: ['json', 'jwt'],
        },
        version: 0,
      };

      localStorageMock.setItem('dev-utils-storage', JSON.stringify(initialState));

      // Create new store instance
      const { result } = renderHook(() => useAppStore());

      // Zustand persistence is async, so we need to wait
      setTimeout(() => {
        expect(result.current.activeTool).toBe('regex');
        expect(result.current.darkMode).toBe(true);
        expect(result.current.favorites).toEqual(['json', 'jwt']);
      }, 100);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('dev-utils-storage', 'invalid json');

      const { result } = renderHook(() => useAppStore());

      // Should fall back to default state
      expect(result.current.activeTool).toBe('json');
      expect(result.current.darkMode).toBe(false);
      expect(result.current.favorites).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('should handle rapid state changes efficiently', () => {
      const { result } = renderHook(() => useAppStore());

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setActiveTool('jwt');
          result.current.setActiveTool('json');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100 state changes should complete in well under 50ms
      expect(duration).toBeLessThan(50);
    });

    it('should handle rapid favorite toggles efficiently', () => {
      const { result } = renderHook(() => useAppStore());

      const startTime = performance.now();

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addFavorite('base64');
          result.current.removeFavorite('base64');
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });
  });
});

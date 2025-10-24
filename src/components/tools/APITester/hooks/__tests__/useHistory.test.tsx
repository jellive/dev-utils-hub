import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useHistory', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.items).toEqual([]);
  });

  it('should save request to history', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        response: {
          status: 200,
          statusText: 'OK',
          body: '{"data": []}',
          headers: { 'content-type': 'application/json' },
          time: 150
        }
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      method: 'GET',
      url: 'https://api.example.com/users'
    });
  });

  it('should assign unique ID and timestamp to each history item', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: ''
      });
    });

    const item = result.current.items[0];
    expect(item.id).toBeDefined();
    expect(item.timestamp).toBeDefined();
    expect(typeof item.timestamp).toBe('number');
  });

  it('should persist history to localStorage', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: {},
        body: '{"name": "John"}'
      });
    });

    const stored = localStorageMock.getItem('api-tester-history');
    expect(stored).toBeDefined();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].method).toBe('POST');
  });

  it('should load history from localStorage on mount', () => {
    const mockHistory = [
      {
        id: '1',
        timestamp: Date.now(),
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: ''
      }
    ];

    localStorageMock.setItem('api-tester-history', JSON.stringify(mockHistory));

    const { result } = renderHook(() => useHistory());

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].url).toBe('https://api.example.com/users');
  });

  it('should limit history to 20 items', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.saveToHistory({
          method: 'GET',
          url: `https://api.example.com/item/${i}`,
          headers: {},
          body: ''
        });
      }
    });

    expect(result.current.items).toHaveLength(20);
    // Should keep the most recent 20 items
    expect(result.current.items[0].url).toBe('https://api.example.com/item/24');
  });

  it('should delete single history item', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: ''
      });
      result.current.saveToHistory({
        method: 'POST',
        url: 'https://api.example.com/posts',
        headers: {},
        body: ''
      });
    });

    const idToDelete = result.current.items[0].id;

    act(() => {
      result.current.deleteItem(idToDelete);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].url).toBe('https://api.example.com/users');
  });

  it('should clear all history', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: ''
      });
      result.current.saveToHistory({
        method: 'POST',
        url: 'https://api.example.com/posts',
        headers: {},
        body: ''
      });
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.items).toEqual([]);
    expect(localStorageMock.getItem('api-tester-history')).toBeNull();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem('api-tester-history', 'invalid json{');

    const { result } = renderHook(() => useHistory());

    expect(result.current.items).toEqual([]);
  });

  it('should save most recent items first', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/first',
        headers: {},
        body: ''
      });
    });

    // Wait a bit to ensure different timestamps
    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/second',
        headers: {},
        body: ''
      });
    });

    expect(result.current.items[0].url).toBe('https://api.example.com/second');
    expect(result.current.items[1].url).toBe('https://api.example.com/first');
  });

  it('should store response data when provided', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        response: {
          status: 404,
          statusText: 'Not Found',
          body: '{"error": "Not found"}',
          headers: { 'content-type': 'application/json' },
          time: 250
        }
      });
    });

    const item = result.current.items[0];
    expect(item.response).toBeDefined();
    expect(item.response?.status).toBe(404);
    expect(item.response?.time).toBe(250);
  });

  it('should store error state when request fails', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.saveToHistory({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        error: 'Network error'
      });
    });

    const item = result.current.items[0];
    expect(item.error).toBe('Network error');
  });
});

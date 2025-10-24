import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQueryParamsSync } from '../useQueryParamsSync';

describe('useQueryParamsSync', () => {
  it('should initialize with empty params when URL has no query string', () => {
    const { result } = renderHook(() => useQueryParamsSync('https://api.example.com/users'));

    expect(result.current.params).toEqual([]);
  });

  it('should parse query parameters from URL', () => {
    const { result } = renderHook(() =>
      useQueryParamsSync('https://api.example.com/users?page=1&limit=10')
    );

    expect(result.current.params).toEqual([
      { key: 'page', value: '1' },
      { key: 'limit', value: '10' }
    ]);
  });

  it('should update URL when params change', () => {
    const { result } = renderHook(() => useQueryParamsSync('https://api.example.com/users'));

    act(() => {
      result.current.setParams([
        { key: 'page', value: '2' },
        { key: 'sort', value: 'name' }
      ]);
    });

    expect(result.current.url).toBe('https://api.example.com/users?page=2&sort=name');
  });

  it('should update params when URL changes', () => {
    const { result, rerender } = renderHook(
      ({ url }) => useQueryParamsSync(url),
      { initialProps: { url: 'https://api.example.com/users?page=1' } }
    );

    expect(result.current.params).toEqual([{ key: 'page', value: '1' }]);

    rerender({ url: 'https://api.example.com/users?page=2&limit=20' });

    expect(result.current.params).toEqual([
      { key: 'page', value: '2' },
      { key: 'limit', value: '20' }
    ]);
  });

  it('should handle empty params by removing query string', () => {
    const { result } = renderHook(() =>
      useQueryParamsSync('https://api.example.com/users?page=1')
    );

    act(() => {
      result.current.setParams([]);
    });

    expect(result.current.url).toBe('https://api.example.com/users');
  });

  it('should handle special characters in param values', () => {
    const { result } = renderHook(() => useQueryParamsSync('https://api.example.com/search'));

    act(() => {
      result.current.setParams([
        { key: 'q', value: 'hello world' },
        { key: 'tags', value: 'foo&bar' }
      ]);
    });

    expect(result.current.url).toBe('https://api.example.com/search?q=hello+world&tags=foo%26bar');
  });

  it('should decode special characters from URL', () => {
    const { result } = renderHook(() =>
      useQueryParamsSync('https://api.example.com/search?q=hello+world&tags=foo%26bar')
    );

    expect(result.current.params).toEqual([
      { key: 'q', value: 'hello world' },
      { key: 'tags', value: 'foo&bar' }
    ]);
  });

  it('should handle URLs without protocol', () => {
    const { result } = renderHook(() => useQueryParamsSync('api.example.com/users?page=1'));

    expect(result.current.params).toEqual([{ key: 'page', value: '1' }]);
  });

  it('should preserve base URL when updating params', () => {
    const { result } = renderHook(() =>
      useQueryParamsSync('https://api.example.com/v1/users?old=value')
    );

    act(() => {
      result.current.setParams([{ key: 'new', value: 'data' }]);
    });

    expect(result.current.url).toBe('https://api.example.com/v1/users?new=data');
  });

  it('should handle empty string param values', () => {
    const { result } = renderHook(() => useQueryParamsSync('https://api.example.com/users'));

    act(() => {
      result.current.setParams([
        { key: 'filter', value: '' },
        { key: 'sort', value: 'name' }
      ]);
    });

    expect(result.current.url).toBe('https://api.example.com/users?filter=&sort=name');
  });

  it('should filter out params with empty keys', () => {
    const { result } = renderHook(() => useQueryParamsSync('https://api.example.com/users'));

    act(() => {
      result.current.setParams([
        { key: '', value: 'ignored' },
        { key: 'valid', value: 'kept' }
      ]);
    });

    expect(result.current.url).toBe('https://api.example.com/users?valid=kept');
  });
});

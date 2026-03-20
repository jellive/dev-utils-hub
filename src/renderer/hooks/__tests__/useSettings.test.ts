import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings, useAllSettings } from '../useSettings';

// Flush pending microtasks/state updates
async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  // @ts-ignore
  delete window.api;
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useSettings (localStorage path)', () => {
  it('returns defaultValue when key is not in localStorage', async () => {
    // Use a primitive default to avoid infinite re-render (object literals create new refs each render)
    const { result } = renderHook(() => useSettings('missing-key', 'default'));
    await flushAsync();
    expect(result.current.loading).toBe(false);
    expect(result.current.value).toBe('default');
    expect(result.current.error).toBeNull();
  });

  it('returns parsed JSON value from localStorage', async () => {
    localStorage.setItem('num-key', '42');
    const { result } = renderHook(() => useSettings('num-key', 0));
    await flushAsync();
    expect(result.current.value).toBe(42);
  });

  it('returns raw string when value is not valid JSON', async () => {
    localStorage.setItem('raw-key', 'plain string');
    const { result } = renderHook(() => useSettings<string>('raw-key', 'default'));
    await flushAsync();
    expect(result.current.value).toBe('plain string');
  });

  it('saves string value to localStorage via setValue', async () => {
    const { result } = renderHook(() => useSettings('save-key', 'initial'));
    await flushAsync();

    await act(async () => {
      await result.current.setValue('updated');
    });

    expect(result.current.value).toBe('updated');
    expect(localStorage.getItem('save-key')).toBe('updated');
  });

  it('serializes number value to JSON when saving', async () => {
    const { result } = renderHook(() => useSettings('num-key', 0));
    await flushAsync();

    await act(async () => {
      await result.current.setValue(99);
    });

    expect(localStorage.getItem('num-key')).toBe('99');
  });

  it('removes key from localStorage via deleteSetting', async () => {
    localStorage.setItem('del-key', '"value"');
    const { result } = renderHook(() => useSettings('del-key', 'default'));
    await flushAsync();

    await act(async () => {
      await result.current.deleteSetting();
    });

    expect(localStorage.getItem('del-key')).toBeNull();
    expect(result.current.value).toBe('default');
  });

  it('transitions to loading=false after async effect', async () => {
    const { result } = renderHook(() => useSettings('loading-key', 'x'));
    await flushAsync();
    expect(result.current.loading).toBe(false);
  });
});

describe('useAllSettings (localStorage path)', () => {
  it('returns empty object when localStorage is empty', async () => {
    const { result } = renderHook(() => useAllSettings());
    await flushAsync();
    expect(result.current.loading).toBe(false);
    expect(result.current.settings).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('returns numeric value from localStorage', async () => {
    localStorage.setItem('key2', '42');
    const { result } = renderHook(() => useAllSettings());
    await flushAsync();
    expect(result.current.settings['key2']).toBe(42);
  });

  it('handles non-JSON string values in localStorage', async () => {
    localStorage.setItem('rawkey', 'not-json');
    const { result } = renderHook(() => useAllSettings());
    await flushAsync();
    expect(result.current.settings['rawkey']).toBe('not-json');
  });

  it('clears all settings via resetSettings', async () => {
    localStorage.setItem('a', '1');
    const { result } = renderHook(() => useAllSettings());
    await flushAsync();

    await act(async () => {
      await result.current.resetSettings();
    });

    expect(result.current.settings).toEqual({});
    expect(localStorage.length).toBe(0);
  });
});

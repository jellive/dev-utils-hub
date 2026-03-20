import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('does not update value before delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    vi.advanceTimersByTime(100);
    expect(result.current).toBe('first');
  });

  it('updates value after delay expires', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('second');
  });

  it('resets timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    vi.advanceTimersByTime(200);
    rerender({ value: 'c' });
    vi.advanceTimersByTime(200);
    // Only 200ms have passed since last change, should not have updated
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe('c');
  });

  it('uses default delay of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'first' } }
    );

    rerender({ value: 'second' });
    vi.advanceTimersByTime(499);
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('works with number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 42 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(42);
  });

  it('works with object values', () => {
    const obj1 = { count: 1 };
    const obj2 = { count: 2 };
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: obj1 } }
    );

    rerender({ value: obj2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(obj2);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePerformanceMonitor } from '../usePerformanceMonitor';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePerformanceMonitor', () => {
  it('mounts without errors', () => {
    expect(() => {
      const { unmount } = renderHook(() => usePerformanceMonitor('test-label'));
      unmount();
    }).not.toThrow();
  });

  it('calls performance.now on mount and unmount', () => {
    const nowSpy = vi.spyOn(performance, 'now');
    const { unmount } = renderHook(() => usePerformanceMonitor('test'));
    unmount();
    // Should have been called at least twice (start + end)
    expect(nowSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('accepts any string label without errors', () => {
    expect(() => {
      const { unmount } = renderHook(() =>
        usePerformanceMonitor('my-long-label-with-dashes_and_underscores')
      );
      unmount();
    }).not.toThrow();
  });

  it('handles empty label without errors', () => {
    expect(() => {
      const { unmount } = renderHook(() => usePerformanceMonitor(''));
      unmount();
    }).not.toThrow();
  });

  it('logs [Performance] message when duration is above threshold', () => {
    // Use a counter-based mock: each call returns an incrementally larger value.
    // This guarantees endTime - startTime is always > 0.1ms regardless of how
    // many internal React/happy-dom calls happen before the hook's own calls.
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => callCount++ * 100);

    const { unmount } = renderHook(() => usePerformanceMonitor('perf-label'));
    unmount();

    // With 100ms increment per call, the gap between any startTime and endTime
    // is at least 100ms — well above the 0.1ms threshold
    const allLogs = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .map(args => String(args[0]));
    const hasPerformanceLog = allLogs.some(msg => msg.includes('perf-label'));
    expect(hasPerformanceLog).toBe(true);
  });

  it('logs warning when duration exceeds 50ms threshold', () => {
    // Same counter-based approach: 100ms per call guarantees >50ms duration
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => callCount++ * 100);

    const { unmount } = renderHook(() => usePerformanceMonitor('slow-label'));
    unmount();

    const allWarns = (console.warn as ReturnType<typeof vi.fn>).mock.calls
      .map(args => String(args[0]));
    const hasWarning = allWarns.some(msg => msg.includes('slow-label'));
    expect(hasWarning).toBe(true);
  });
});

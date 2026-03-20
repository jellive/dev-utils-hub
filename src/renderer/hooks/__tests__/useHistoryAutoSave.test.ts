import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryAutoSave } from '../useHistoryAutoSave';

const mockSave = vi.fn().mockResolvedValue(1);

beforeEach(() => {
  vi.useFakeTimers();
  // @ts-ignore
  window.api = { history: { save: mockSave } };
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  // @ts-ignore
  delete window.api;
});

describe('useHistoryAutoSave', () => {
  it('returns a function', () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test' }));
    expect(typeof result.current).toBe('function');
  });

  it('saves after default delay (1000ms)', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test' }));

    act(() => {
      result.current('my input', 'my output');
    });

    expect(mockSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSave).toHaveBeenCalledWith('test', 'my input', 'my output', undefined);
  });

  it('saves after custom delay', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test', delay: 500 }));

    act(() => {
      result.current('input');
    });

    vi.advanceTimersByTime(499);
    expect(mockSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid calls — only saves once', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test', delay: 300 }));

    act(() => {
      result.current('first');
      result.current('second');
      result.current('third');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('test', 'third', undefined, undefined);
  });

  it('does not save when input is empty string', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test' }));

    act(() => {
      result.current('');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does not save when input is whitespace only', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test' }));

    act(() => {
      result.current('   ');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does not save when enabled=false', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test', enabled: false }));

    act(() => {
      result.current('valid input');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does not save when window.api is unavailable', async () => {
    // @ts-ignore
    delete window.api;
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test' }));

    act(() => {
      result.current('input');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSave).not.toHaveBeenCalled();
  });

  it('passes metadata to save', async () => {
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'mytool' }));

    act(() => {
      result.current('input', 'output', { unit: 'ms', timezone: 'UTC' });
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSave).toHaveBeenCalledWith('mytool', 'input', 'output', { unit: 'ms', timezone: 'UTC' });
  });

  it('handles save errors silently without throwing', async () => {
    mockSave.mockRejectedValueOnce(new Error('DB error'));
    const { result } = renderHook(() => useHistoryAutoSave({ tool: 'test' }));

    act(() => {
      result.current('input');
    });

    // Should not throw
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // No assertion on thrown — just verifying it doesn't propagate
    expect(true).toBe(true);
  });
});

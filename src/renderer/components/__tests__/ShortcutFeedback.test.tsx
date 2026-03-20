import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { ShortcutFeedback, useShortcutFeedback } from '../ShortcutFeedback';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ShortcutFeedback', () => {
  it('renders shortcut and description text', () => {
    render(
      <ShortcutFeedback shortcut="⌘1" description="JSON Formatter" onAnimationEnd={vi.fn()} />
    );
    expect(screen.getByText('⌘1')).toBeInTheDocument();
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument();
  });

  it('calls onAnimationEnd after 2000ms', () => {
    const onAnimationEnd = vi.fn();
    render(
      <ShortcutFeedback shortcut="⌘1" description="Test" onAnimationEnd={onAnimationEnd} />
    );
    expect(onAnimationEnd).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it('does not call onAnimationEnd before 2000ms', () => {
    const onAnimationEnd = vi.fn();
    render(
      <ShortcutFeedback shortcut="⌘1" description="Test" onAnimationEnd={onAnimationEnd} />
    );
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it('cleans up timers on unmount', () => {
    const onAnimationEnd = vi.fn();
    const { unmount } = render(
      <ShortcutFeedback shortcut="⌘1" description="Test" onAnimationEnd={onAnimationEnd} />
    );
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });
});

describe('useShortcutFeedback', () => {
  it('starts with null feedback and null FeedbackComponent', () => {
    const { result } = renderHook(() => useShortcutFeedback());
    expect(result.current.feedback).toBeNull();
    expect(result.current.FeedbackComponent).toBeNull();
  });

  it('exposes showFeedback function', () => {
    const { result } = renderHook(() => useShortcutFeedback());
    expect(typeof result.current.showFeedback).toBe('function');
  });

  it('sets feedback when showFeedback is called', () => {
    const { result } = renderHook(() => useShortcutFeedback());
    act(() => {
      result.current.showFeedback('⌘2', 'JWT Decoder');
    });
    expect(result.current.feedback).toEqual({ shortcut: '⌘2', description: 'JWT Decoder' });
  });

  it('renders FeedbackComponent when feedback is set', () => {
    const { result } = renderHook(() => useShortcutFeedback());
    act(() => {
      result.current.showFeedback('⌘K', 'Command Palette');
    });
    expect(result.current.FeedbackComponent).not.toBeNull();
  });

  it('clears feedback after animation ends when FeedbackComponent is rendered', () => {
    // Need to render the FeedbackComponent for its timers to fire
    function TestWrapper() {
      const { showFeedback, feedback, FeedbackComponent } = useShortcutFeedback();
      return (
        <div>
          <button onClick={() => showFeedback('⌘1', 'JSON')}>show</button>
          <div data-testid="feedback-status">{feedback ? 'shown' : 'hidden'}</div>
          {FeedbackComponent}
        </div>
      );
    }

    const { getByRole, getByTestId } = render(<TestWrapper />);
    expect(getByTestId('feedback-status').textContent).toBe('hidden');

    act(() => {
      fireEvent.click(getByRole('button', { name: 'show' }));
    });
    expect(getByTestId('feedback-status').textContent).toBe('shown');

    // Advance past the 2000ms animation timer
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(getByTestId('feedback-status').textContent).toBe('hidden');
  });
});

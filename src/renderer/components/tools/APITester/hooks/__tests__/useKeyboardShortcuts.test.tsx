import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ctrl+Enter - Send Request', () => {
    it('should call onSend when Ctrl+Enter is pressed', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
      expect(onClear).not.toHaveBeenCalled();
    });

    it('should call onSend when Cmd+Enter is pressed (Mac)', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should not call onSend when disabled', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: false }));

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onSend).not.toHaveBeenCalled();
    });

    it('should not call onSend when only Enter is pressed', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('Escape - Cancel Request', () => {
    it('should call onCancel when Escape is pressed', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSend).not.toHaveBeenCalled();
      expect(onClear).not.toHaveBeenCalled();
    });

    it('should not call onCancel when disabled', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: false }));

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Ctrl+L - Clear Form', () => {
    it('should call onClear when Ctrl+L is pressed', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onSend).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onClear when Cmd+L is pressed (Mac)', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'l',
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('should prevent default browser behavior for Ctrl+L', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        bubbles: true,
      });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not call onClear when disabled', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: false }));

      const event = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      expect(onClear).not.toHaveBeenCalled();
    });
  });

  describe('Event Listener Management', () => {
    it('should cleanup event listeners on unmount', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not trigger shortcuts when typing in input fields', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });

      document.dispatchEvent(event);

      // Shortcuts should still work even in input fields for Ctrl+Enter
      expect(onSend).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });

    it('should not trigger shortcuts when typing in textarea', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: textarea, enumerable: true });

      document.dispatchEvent(event);

      // Shortcuts should still work in textarea for Ctrl+Enter
      expect(onSend).toHaveBeenCalledTimes(1);

      document.body.removeChild(textarea);
    });
  });

  describe('Multiple Shortcut Combinations', () => {
    it('should not trigger multiple shortcuts simultaneously', () => {
      const onSend = vi.fn();
      const onCancel = vi.fn();
      const onClear = vi.fn();

      renderHook(() => useKeyboardShortcuts({ onSend, onCancel, onClear, enabled: true }));

      const event = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);

      // Should only trigger Ctrl+L, not additional shortcuts
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onSend).not.toHaveBeenCalled();
    });
  });
});

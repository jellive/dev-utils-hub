import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onSend: () => void;
  onCancel: () => void;
  onClear: () => void;
  enabled: boolean;
}

export function useKeyboardShortcuts({
  onSend,
  onCancel,
  onClear,
  enabled,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ctrl+Enter or Cmd+Enter - Send Request
      if (isCtrlOrCmd && event.key === 'Enter') {
        event.preventDefault();
        onSend();
        return;
      }

      // Escape - Cancel Request
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      // Ctrl+L or Cmd+L - Clear Form
      if (isCtrlOrCmd && event.key === 'l') {
        event.preventDefault();
        onClear();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSend, onCancel, onClear, enabled]);
}

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ErrorTrigger Component
 *
 * Development-only component for testing Sentry ErrorBoundary.
 * Provides a button that throws an error when clicked.
 *
 * @example
 * ```tsx
 * {import.meta.env.DEV && <ErrorTrigger />}
 * ```
 */
export function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Test error triggered by ErrorTrigger component');
  }

  const handleClick = () => {
    setShouldThrow(true);
  };

  return (
    <Button
      onClick={handleClick}
      variant="destructive"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-destructive"
    >
      <AlertTriangle className="mr-2 h-4 w-4" />
      Trigger Error (Dev Only)
    </Button>
  );
}

/**
 * Error Trigger Component
 * Development-only component for testing Sentry error tracking
 */

import * as Sentry from '@sentry/react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export function ErrorTrigger() {
  // Only show in development or when Sentry is enabled
  if (import.meta.env.PROD && !Sentry.isInitialized()) {
    return null;
  }

  const handleError = () => {
    throw new Error('Test error triggered from ErrorTrigger component');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleError}
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
            >
              <AlertCircle className="h-6 w-6" />
              <span className="sr-only">Trigger test error</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Trigger test error for Sentry</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

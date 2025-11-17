import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleReload = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6 lucide-alert-circle" />
            Something Went Wrong
          </CardTitle>
          <CardDescription>
            We're sorry, but something unexpected happened. Please try reloading the page or
            return to the home page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 border border-destructive p-4"
          >
            <p className="text-sm font-medium text-destructive">{error.message}</p>
          </div>

          {/* Error Stack (Development Only) */}
          {import.meta.env.DEV && error.stack && (
            <details className="rounded-lg bg-muted p-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Technical Details (Development Mode)
              </summary>
              <pre className="text-xs overflow-auto max-h-60 text-muted-foreground whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-col sm:flex-row">
            <Button onClick={handleReload} className="flex-1" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
            <Button onClick={handleGoHome} className="flex-1" variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

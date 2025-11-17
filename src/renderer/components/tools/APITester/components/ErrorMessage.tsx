import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 text-sm text-destructive mt-1">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

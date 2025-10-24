import { Button } from '@/components/ui/button';
import { Send, Loader2, X } from 'lucide-react';

interface SendButtonProps {
  onSend: () => void;
  onCancel: () => void;
  disabled: boolean;
  loading: boolean;
}

export function SendButton({ onSend, onCancel, disabled, loading }: SendButtonProps) {
  return (
    <div className="flex gap-2">
      {loading ? (
        <>
          <Button disabled variant="secondary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin lucide-loader-2" />
            Sending...
          </Button>
          <Button onClick={onCancel} variant="outline" size="icon" aria-label="Cancel">
            <X className="h-4 w-4 lucide-x" />
          </Button>
        </>
      ) : (
        <Button onClick={onSend} disabled={disabled} aria-label="Send">
          <Send className="h-4 w-4 mr-2 lucide-send" />
          Send
        </Button>
      )}
    </div>
  );
}

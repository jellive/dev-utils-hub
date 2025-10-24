import { Button } from '@/components/ui/button';
import { Copy, Download, FileJson } from 'lucide-react';
import { toast } from 'sonner';

interface ResponseActionsProps {
  body: string;
  contentType: string;
  onCopy?: (body: string) => void;
  onDownload?: (body: string, contentType: string) => void;
  onOpenInJSONFormatter?: () => void;
}

export function ResponseActions({
  body,
  contentType,
  onCopy,
  onDownload,
  onOpenInJSONFormatter
}: ResponseActionsProps) {
  const isJSON = contentType.includes('application/json') || contentType.includes('application/vnd.api+json');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      toast.success('Copied to clipboard');
      onCopy?.(body);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    onDownload?.(body, contentType);

    try {
      const blob = new Blob([body], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const extension = isJSON ? 'json' : 'txt';
      a.download = `response.${extension}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Downloaded successfully');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 border-t">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="h-4 w-4 mr-1" />
        Copy
      </Button>

      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-1" />
        Download
      </Button>

      {isJSON && (
        <Button variant="outline" size="sm" onClick={onOpenInJSONFormatter}>
          <FileJson className="h-4 w-4 mr-1" />
          Open in JSON Formatter
        </Button>
      )}
    </div>
  );
}

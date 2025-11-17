import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, FileText, Code } from 'lucide-react';
import { toast } from 'sonner';

interface ResponseBodyProps {
  body: string;
  contentType: string;
}

export function ResponseBody({ body, contentType }: ResponseBodyProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  const isJSON = contentType.includes('application/json') || contentType.includes('application/vnd.api+json');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const getFormattedBody = () => {
    if (!body) return '';

    if (isJSON && viewMode === 'formatted') {
      try {
        const parsed = JSON.parse(body);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If JSON parsing fails, return raw body
        return body;
      }
    }

    return body;
  };

  if (!body) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No body content
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2 border-b">
        {isJSON && (
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'formatted' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('formatted')}
            >
              <Code className="h-4 w-4 mr-1" />
              Formatted
            </Button>
            <Button
              variant={viewMode === 'raw' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('raw')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Raw
            </Button>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} className="ml-auto">
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>

      <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[600px] text-sm font-mono whitespace-pre-wrap break-all">
        {getFormattedBody()}
      </pre>
    </div>
  );
}

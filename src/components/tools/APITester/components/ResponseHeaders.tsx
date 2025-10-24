import { Badge } from '@/components/ui/badge';

interface ResponseHeadersProps {
  headers: Record<string, string>;
}

export function ResponseHeaders({ headers }: ResponseHeadersProps) {
  const headerCount = Object.keys(headers).length;

  if (headerCount === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No headers
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-2 border-b">
        <span className="text-sm font-semibold">Headers</span>
        <Badge variant="secondary">{headerCount}</Badge>
      </div>

      <div className="space-y-2 p-4">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="flex gap-4 text-sm border-b pb-2 last:border-0">
            <span className="font-semibold min-w-[200px] break-all">{key}</span>
            <span className="font-mono text-muted-foreground break-all flex-1">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

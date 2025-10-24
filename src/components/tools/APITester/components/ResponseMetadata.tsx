import { Badge } from '@/components/ui/badge';
import { Clock, HardDrive } from 'lucide-react';

interface ResponseMetadataProps {
  status: number;
  time: number;
  size: number;
}

export function ResponseMetadata({ status, time, size }: ResponseMetadataProps) {
  const getStatusBadgeClass = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-500 hover:bg-green-600';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'bg-blue-500 hover:bg-blue-600';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'bg-yellow-500 hover:bg-yellow-600';
    } else if (statusCode >= 500) {
      return 'bg-red-500 hover:bg-red-600';
    }
    return 'bg-gray-500 hover:bg-gray-600';
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTime = (ms: number): string => {
    return `${ms} ms`;
  };

  return (
    <div role="status" className="flex flex-wrap items-center gap-4 p-4 border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge className={`badge ${getStatusBadgeClass(status)} text-white`}>
          {status}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Time:</span>
        <span className="text-sm font-mono">{formatTime(time)}</span>
      </div>

      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Size:</span>
        <span className="text-sm font-mono">{formatSize(size)}</span>
      </div>
    </div>
  );
}

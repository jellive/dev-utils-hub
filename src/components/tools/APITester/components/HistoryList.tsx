import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search } from 'lucide-react';
import type { HistoryItem } from '../hooks/useHistory';

interface HistoryListProps {
  items: HistoryItem[];
  onRestore?: (item: HistoryItem) => void;
  onDelete?: (id: string) => void;
}

export function HistoryList({ items, onRestore, onDelete }: HistoryListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter and search items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Method filter
      if (methodFilter !== 'all' && item.method !== methodFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'success' && !item.response) {
        return false;
      }
      if (statusFilter === 'error' && !item.error) {
        return false;
      }

      // Search query (search in URL and method)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesUrl = item.url.toLowerCase().includes(query);
        const matchesMethod = item.method.toLowerCase().includes(query);
        return matchesUrl || matchesMethod;
      }

      return true;
    });
  }, [items, searchQuery, methodFilter, statusFilter]);

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  // Get method color
  const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      PATCH: 'bg-orange-100 text-orange-800',
      DELETE: 'bg-red-100 text-red-800'
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  // Get status color
  const getStatusColor = (status?: number): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('tools.api.history.noHistory')}</p>
        <p className="text-sm mt-1">{t('tools.api.history.requestsWillAppear')}</p>
      </div>
    );
  }

  // No results state
  if (filteredItems.length === 0) {
    return (
      <div>
        {/* Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('tools.api.history.searchHistory')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="method-filter" className="sr-only">{t('tools.api.method')}</Label>
              <select
                id="method-filter"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label={t('tools.api.history.methodFilter')}
              >
                <option value="all">{t('tools.api.history.allMethods')}</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="flex-1">
              <Label htmlFor="status-filter" className="sr-only">{t('tools.api.status')}</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                aria-label={t('tools.api.history.statusFilter')}
              >
                <option value="all">{t('tools.api.history.allStatus')}</option>
                <option value="success">{t('tools.api.history.success')}</option>
                <option value="error">{t('tools.api.history.error')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-center py-8 text-muted-foreground">
          <p>{t('tools.api.history.noResults')}</p>
          <p className="text-sm mt-1">{t('tools.api.history.tryAdjusting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('tools.api.history.searchHistory')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="method-filter" className="sr-only">{t('tools.api.method')}</Label>
            <select
              id="method-filter"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={t('tools.api.history.methodFilter')}
            >
              <option value="all">{t('tools.api.history.allMethods')}</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="flex-1">
            <Label htmlFor="status-filter" className="sr-only">{t('tools.api.status')}</Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label={t('tools.api.history.statusFilter')}
            >
              <option value="all">{t('tools.api.history.allStatus')}</option>
              <option value="success">{t('tools.api.history.success')}</option>
              <option value="error">{t('tools.api.history.error')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Items */}
      <div className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <Button
                variant="ghost"
                className="flex-1 justify-start text-left h-auto p-0 hover:bg-transparent"
                onClick={() => onRestore?.(item)}
              >
                <div className="space-y-1 w-full">
                  {/* Method and URL */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getMethodColor(item.method)}>
                      {item.method}
                    </Badge>
                    <span className="text-sm font-mono truncate flex-1">
                      {item.url}
                    </span>
                  </div>

                  {/* Status and Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.response && (
                      <Badge variant="outline" className={getStatusColor(item.response.status)}>
                        {item.response.status}
                      </Badge>
                    )}
                    {item.error && (
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        {t('tools.api.history.error')}
                      </Badge>
                    )}
                    <span>{formatRelativeTime(item.timestamp)}</span>
                    {item.response?.time && (
                      <span>• {item.response.time}ms</span>
                    )}
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onDelete?.(item.id)}
                aria-label={t('tools.api.history.delete')}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

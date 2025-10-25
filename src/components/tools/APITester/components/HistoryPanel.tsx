import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface HistoryPanelProps {
  children?: ReactNode;
  count?: number;
  onClear?: () => void;
}

export function HistoryPanel({ children, count = 0, onClear }: HistoryPanelProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-6 w-6 p-0"
            aria-label={isExpanded ? t('tools.api.history.collapse') : t('tools.api.history.expand')}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <h3 className="text-sm font-semibold">{t('tools.api.history.title')}</h3>

          <Badge variant="secondary">{count}</Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={count === 0}
          className="h-8"
          aria-label={t('tools.api.history.clear')}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {t('tools.api.history.clear')}
        </Button>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

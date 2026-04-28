import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { describeCron, getNextExecutions, isValidCron } from './cron/cron-utils';

interface CronField {
  label: string;
  value: string;
}

interface Preset {
  label: string;
  value: string;
  description: string;
}

const PRESETS: Preset[] = [
  { label: 'Every minute', value: '* * * * *', description: 'Runs every minute' },
  { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
  { label: 'Every day at midnight', value: '0 0 * * *', description: 'Runs daily at midnight' },
  { label: 'Every day at noon', value: '0 12 * * *', description: 'Runs daily at 12:00 PM' },
  { label: 'Every Monday', value: '0 0 * * 1', description: 'Runs every Monday at midnight' },
  { label: 'Every weekday', value: '0 9 * * 1-5', description: 'Runs Mon-Fri at 9:00 AM' },
  { label: 'Every Sunday', value: '0 0 * * 0', description: 'Runs every Sunday at midnight' },
  { label: 'Every month (1st)', value: '0 0 1 * *', description: 'Runs on 1st of every month' },
  { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Runs every 5 minutes' },
  { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Runs every 15 minutes' },
  { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Runs every 30 minutes' },
  { label: 'Twice daily', value: '0 0,12 * * *', description: 'Runs at midnight and noon' },
];

export function CronParser() {
  const { t } = useTranslation();
  const [expression, setExpression] = useState('* * * * *');
  const [description, setDescription] = useState<{ en: string; ko: string } | null>(null);
  const [nextRuns, setNextRuns] = useState<Date[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!expression.trim()) {
      setDescription(null);
      setNextRuns([]);
      setError('');
      return;
    }

    if (!isValidCron(expression)) {
      setError(t('tools.cronParser.invalidExpression'));
      setDescription(null);
      setNextRuns([]);
      return;
    }

    setError('');
    const desc = describeCron(expression);
    setDescription(desc);
    try {
      const runs = getNextExecutions(expression, 5);
      setNextRuns(runs);
    } catch {
      setNextRuns([]);
    }
  }, [expression, t]);

  const handlePresetChange = (value: string) => {
    setExpression(value);
  };

  const copyExpression = () => {
    navigator.clipboard.writeText(expression);
    toast.success(t('common.copied'));
  };

  const fields: CronField[] = expression
    .trim()
    .split(/\s+/)
    .map((v, i) => {
      const labels = ['Minute', 'Hour', 'Day', 'Month', 'Weekday', 'Second'];
      return { label: labels[i] || `Field ${i + 1}`, value: v };
    });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t('tools.cronParser.title')}
      </h2>

      {/* Preset Selector */}
      <div className="space-y-2">
        <Label>{t('tools.cronParser.presets')}</Label>
        <Select onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('tools.cronParser.selectPreset')} />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map(p => (
              <SelectItem key={p.value} value={p.value}>
                {p.label} — {p.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Expression Input */}
      <div className="space-y-2">
        <Label htmlFor="cron-input">{t('tools.cronParser.expression')}</Label>
        <div className="flex gap-2">
          <Input
            id="cron-input"
            value={expression}
            onChange={e => setExpression(e.target.value)}
            placeholder="* * * * *"
            className="font-mono flex-1"
            data-testid="cron-input"
          />
          <button
            onClick={copyExpression}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('common.copy')}
          </button>
        </div>

        {/* Field Labels */}
        <div className="flex gap-2 px-1">
          {fields.map(f => (
            <div key={f.label} className="flex-1 text-center">
              <div className="text-xs text-muted-foreground">{f.label}</div>
              <div className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('tools.cronParser.description')}
          </h3>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                English
              </span>
              <p
                className="text-green-900 dark:text-green-300 font-medium"
                data-testid="description-en"
              >
                {description.en}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                한국어
              </span>
              <p
                className="text-green-900 dark:text-green-300 font-medium"
                data-testid="description-ko"
              >
                {description.ko}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Executions */}
      {nextRuns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('tools.cronParser.nextRuns')}
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {nextRuns.map((date, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800"
              >
                <span className="text-sm text-muted-foreground">#{i + 1}</span>
                <span
                  className="font-mono text-sm text-gray-900 dark:text-white"
                  data-testid={`next-run-${i}`}
                >
                  {date.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {date.toISOString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {t('tools.cronParser.reference')}
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-400">
          <div>
            <code>*</code> — any value
          </div>
          <div>
            <code>*/n</code> — every n units
          </div>
          <div>
            <code>a-b</code> — range a to b
          </div>
          <div>
            <code>a,b,c</code> — list of values
          </div>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-500 mt-2">
          Format: <code className="font-mono">minute hour day month weekday</code>
        </p>
      </div>
    </div>
  );
}

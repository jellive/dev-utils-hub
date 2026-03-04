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

function describeCronField(value: string, type: 'minute' | 'hour' | 'day' | 'month' | 'weekday'): string {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  if (value === '*') {
    const map = { minute: 'every minute', hour: 'every hour', day: 'every day', month: 'every month', weekday: 'every weekday' };
    return map[type];
  }

  if (value.startsWith('*/')) {
    const step = value.slice(2);
    const map = { minute: `every ${step} minutes`, hour: `every ${step} hours`, day: `every ${step} days`, month: `every ${step} months`, weekday: `every ${step} weekdays` };
    return map[type];
  }

  if (value.includes('-')) {
    const [start, end] = value.split('-');
    if (type === 'weekday') return `${WEEKDAYS[Number(start)] || start} through ${WEEKDAYS[Number(end)] || end}`;
    if (type === 'month') return `${MONTHS[Number(start)-1] || start} through ${MONTHS[Number(end)-1] || end}`;
    return `${start} through ${end}`;
  }

  if (value.includes(',')) {
    const parts = value.split(',');
    if (type === 'weekday') return parts.map(p => WEEKDAYS[Number(p)] || p).join(', ');
    if (type === 'month') return parts.map(p => MONTHS[Number(p)-1] || p).join(', ');
    return parts.join(', ');
  }

  if (type === 'weekday') return WEEKDAYS[Number(value)] || value;
  if (type === 'month') return MONTHS[Number(value)-1] || value;
  return value;
}

function describeCron(expression: string): { en: string; ko: string } | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return null;

  const [minute, hour, day, month, weekday] = parts;

  const minuteDesc = describeCronField(minute, 'minute');
  const hourDesc = describeCronField(hour, 'hour');
  const dayDesc = describeCronField(day, 'day');
  const monthDesc = describeCronField(month, 'month');
  const weekdayDesc = describeCronField(weekday, 'weekday');

  let en = 'Runs ';
  if (minute === '*' && hour === '*') {
    en += 'every minute';
  } else if (minute.startsWith('*/')) {
    en += `every ${minute.slice(2)} minutes`;
  } else if (hour === '*') {
    en += `at minute ${minuteDesc} of every hour`;
  } else {
    const h = Number(hour);
    const m = minute === '*' ? 0 : Number(minute);
    if (!isNaN(h) && !isNaN(m)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      en += `at ${h12}:${m.toString().padStart(2,'0')} ${ampm}`;
    } else {
      en += `at ${hourDesc}:${minuteDesc}`;
    }
  }

  if (day !== '*') en += `, on day ${dayDesc} of the month`;
  if (month !== '*') en += `, in ${monthDesc}`;
  if (weekday !== '*') en += `, on ${weekdayDesc}`;

  // Korean
  let ko = '';
  if (minute === '*' && hour === '*') {
    ko += '매 분마다 실행';
  } else if (minute.startsWith('*/')) {
    ko += `매 ${minute.slice(2)}분마다 실행`;
  } else if (hour === '*') {
    ko += `매 시간 ${minuteDesc}분에 실행`;
  } else {
    const h = Number(hour);
    const m = minute === '*' ? 0 : Number(minute);
    if (!isNaN(h) && !isNaN(m)) {
      ko += `${h}시 ${m.toString().padStart(2,'0')}분에 실행`;
    } else {
      ko += `${hourDesc} ${minuteDesc}분에 실행`;
    }
  }

  if (day !== '*') ko += `, 매월 ${dayDesc}일`;
  if (month !== '*') ko += `, ${monthDesc}월`;
  if (weekday !== '*') ko += `, ${weekdayDesc}마다`;

  return { en, ko };
}

function getNextExecutions(expression: string, count: number): Date[] {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return [];

  const [minuteExpr, hourExpr, dayExpr, monthExpr, weekdayExpr] = parts;

  function matches(value: number, expr: string, min: number, max: number): boolean {
    if (expr === '*') return true;
    if (expr.startsWith('*/')) {
      const step = Number(expr.slice(2));
      return value % step === 0;
    }
    if (expr.includes(',')) return expr.split(',').some(p => Number(p) === value);
    if (expr.includes('-')) {
      const [lo, hi] = expr.split('-').map(Number);
      return value >= lo && value <= hi;
    }
    return Number(expr) === value;
  }

  const results: Date[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  const current = new Date(now.getTime() + 60000); // start from next minute

  let iterations = 0;
  const MAX = 500000;

  while (results.length < count && iterations < MAX) {
    iterations++;
    const min = current.getMinutes();
    const hr = current.getHours();
    const d = current.getDate();
    const mo = current.getMonth() + 1;
    const wd = current.getDay();

    if (
      matches(min, minuteExpr, 0, 59) &&
      matches(hr, hourExpr, 0, 23) &&
      matches(d, dayExpr, 1, 31) &&
      matches(mo, monthExpr, 1, 12) &&
      matches(wd, weekdayExpr, 0, 6)
    ) {
      results.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}

function isValidCron(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

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

  const fields: CronField[] = expression.trim().split(/\s+/).map((v, i) => {
    const labels = ['Minute', 'Hour', 'Day', 'Month', 'Weekday', 'Second'];
    return { label: labels[i] || `Field ${i+1}`, value: v };
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.cronParser.title')}</h2>

      {/* Preset Selector */}
      <div className="space-y-2">
        <Label>{t('tools.cronParser.presets')}</Label>
        <Select onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('tools.cronParser.selectPreset')} />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
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
            onChange={(e) => setExpression(e.target.value)}
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
          {fields.map((f) => (
            <div key={f.label} className="flex-1 text-center">
              <div className="text-xs text-muted-foreground">{f.label}</div>
              <div className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">{f.value}</div>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tools.cronParser.description')}</h3>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">English</span>
              <p className="text-green-900 dark:text-green-300 font-medium" data-testid="description-en">{description.en}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">한국어</span>
              <p className="text-green-900 dark:text-green-300 font-medium" data-testid="description-ko">{description.ko}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Executions */}
      {nextRuns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tools.cronParser.nextRuns')}</h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {nextRuns.map((date, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                <span className="text-sm text-muted-foreground">#{i + 1}</span>
                <span className="font-mono text-sm text-gray-900 dark:text-white" data-testid={`next-run-${i}`}>
                  {date.toLocaleString('ko-KR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
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
          <div><code>*</code> — any value</div>
          <div><code>*/n</code> — every n units</div>
          <div><code>a-b</code> — range a to b</div>
          <div><code>a,b,c</code> — list of values</div>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-500 mt-2">
          Format: <code className="font-mono">minute hour day month weekday</code>
        </p>
      </div>
    </div>
  );
}

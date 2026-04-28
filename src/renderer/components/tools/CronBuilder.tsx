import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { describeCron, getNextExecutions } from './cron/cron-utils';

type Mode = 'every' | 'specific' | 'range' | 'list' | 'step';

interface FieldState {
  mode: Mode;
  specific: string;
  rangeFrom: string;
  rangeTo: string;
  list: string;
  step: string;
}

interface FieldSpec {
  key: 'minute' | 'hour' | 'day' | 'month' | 'weekday';
  title: string;
  description: string;
  min: number;
  max: number;
}

const FIELDS: FieldSpec[] = [
  { key: 'minute', title: 'Minute', description: '0–59', min: 0, max: 59 },
  { key: 'hour', title: 'Hour', description: '0–23', min: 0, max: 23 },
  { key: 'day', title: 'Day of Month', description: '1–31', min: 1, max: 31 },
  { key: 'month', title: 'Month', description: '1–12', min: 1, max: 12 },
  { key: 'weekday', title: 'Day of Week', description: '0–6 (Sun–Sat)', min: 0, max: 6 },
];

function defaultField(spec: FieldSpec): FieldState {
  return {
    mode: 'every',
    specific: String(spec.min),
    rangeFrom: String(spec.min),
    rangeTo: String(spec.max),
    list: '',
    step: '5',
  };
}

export function fieldToCron(field: FieldState): string {
  switch (field.mode) {
    case 'every':
      return '*';
    case 'specific':
      return field.specific.trim() || '*';
    case 'range':
      return `${field.rangeFrom.trim()}-${field.rangeTo.trim()}`;
    case 'list':
      return field.list.trim() || '*';
    case 'step':
      return `*/${field.step.trim()}`;
  }
}

export function CronBuilder() {
  const [fields, setFields] = useState<Record<string, FieldState>>(() => {
    const init: Record<string, FieldState> = {};
    for (const spec of FIELDS) init[spec.key] = defaultField(spec);
    return init;
  });

  const expression = useMemo(
    () => FIELDS.map(spec => fieldToCron(fields[spec.key])).join(' '),
    [fields]
  );

  const description = useMemo(() => describeCron(expression), [expression]);
  const nextRuns = useMemo(() => {
    try {
      return getNextExecutions(expression, 5);
    } catch {
      return [];
    }
  }, [expression]);

  const updateField = (key: string, partial: Partial<FieldState>) => {
    setFields(prev => ({ ...prev, [key]: { ...prev[key], ...partial } }));
  };

  const copyExpression = async () => {
    try {
      await navigator.clipboard.writeText(expression);
      toast.success('Copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cron Builder</h2>

      {/* Output expression */}
      <Card>
        <CardHeader>
          <CardTitle>Expression</CardTitle>
          <CardDescription>Generated from the fields below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={expression}
              readOnly
              data-testid="cron-output"
              className="font-mono flex-1"
            />
            <Button onClick={copyExpression} variant="outline" className="gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Field cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map(spec => {
          const f = fields[spec.key];
          return (
            <Card key={spec.key} data-testid={`field-${spec.key}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{spec.title}</CardTitle>
                <CardDescription>{spec.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Mode</Label>
                  <div
                    role="radiogroup"
                    aria-label={`${spec.title} mode`}
                    data-testid={`mode-${spec.key}`}
                    className="flex flex-wrap gap-1"
                  >
                    {(['every', 'specific', 'range', 'list', 'step'] as Mode[]).map(m => (
                      <Button
                        key={m}
                        type="button"
                        size="sm"
                        variant={f.mode === m ? 'default' : 'outline'}
                        data-testid={`mode-${spec.key}-${m}`}
                        aria-pressed={f.mode === m}
                        onClick={() => updateField(spec.key, { mode: m })}
                        className="capitalize"
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>

                {f.mode === 'specific' && (
                  <div className="space-y-1">
                    <Label htmlFor={`specific-${spec.key}`}>Value</Label>
                    <Input
                      id={`specific-${spec.key}`}
                      data-testid={`specific-${spec.key}`}
                      type="number"
                      min={spec.min}
                      max={spec.max}
                      value={f.specific}
                      onChange={e => updateField(spec.key, { specific: e.target.value })}
                    />
                  </div>
                )}

                {f.mode === 'range' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`from-${spec.key}`}>From</Label>
                      <Input
                        id={`from-${spec.key}`}
                        data-testid={`from-${spec.key}`}
                        type="number"
                        min={spec.min}
                        max={spec.max}
                        value={f.rangeFrom}
                        onChange={e => updateField(spec.key, { rangeFrom: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`to-${spec.key}`}>To</Label>
                      <Input
                        id={`to-${spec.key}`}
                        data-testid={`to-${spec.key}`}
                        type="number"
                        min={spec.min}
                        max={spec.max}
                        value={f.rangeTo}
                        onChange={e => updateField(spec.key, { rangeTo: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {f.mode === 'list' && (
                  <div className="space-y-1">
                    <Label htmlFor={`list-${spec.key}`}>Values (comma-separated)</Label>
                    <Input
                      id={`list-${spec.key}`}
                      data-testid={`list-${spec.key}`}
                      type="text"
                      placeholder="e.g. 1,3,5"
                      value={f.list}
                      onChange={e => updateField(spec.key, { list: e.target.value })}
                    />
                  </div>
                )}

                {f.mode === 'step' && (
                  <div className="space-y-1">
                    <Label htmlFor={`step-${spec.key}`}>Every N</Label>
                    <Input
                      id={`step-${spec.key}`}
                      data-testid={`step-${spec.key}`}
                      type="number"
                      min={1}
                      value={f.step}
                      onChange={e => updateField(spec.key, { step: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      every {f.step || '?'} {spec.title.toLowerCase()}
                      {Number(f.step) === 1 ? '' : 's'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Description */}
      {description && (
        <Card data-testid="description-card">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                English
              </span>
              <p
                className="font-medium text-green-900 dark:text-green-300"
                data-testid="description-en"
              >
                {description.en}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                한국어
              </span>
              <p
                className="font-medium text-green-900 dark:text-green-300"
                data-testid="description-ko"
              >
                {description.ko}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next executions */}
      {nextRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next 5 executions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {nextRuns.map((date, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 dark:border-gray-700"
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
                  })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

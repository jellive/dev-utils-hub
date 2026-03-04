import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Unit = 'px' | 'rem' | 'em' | 'vh' | 'vw' | '%';

const UNITS: Unit[] = ['px', 'rem', 'em', 'vh', 'vw', '%'];

interface Config {
  baseFontSize: number;
  viewportWidth: number;
  viewportHeight: number;
  parentFontSize: number;
  parentSize: number;
}

function toPx(value: number, unit: Unit, config: Config): number {
  switch (unit) {
    case 'px': return value;
    case 'rem': return value * config.baseFontSize;
    case 'em': return value * config.parentFontSize;
    case 'vh': return (value / 100) * config.viewportHeight;
    case 'vw': return (value / 100) * config.viewportWidth;
    case '%': return (value / 100) * config.parentSize;
    default: return value;
  }
}

function fromPx(px: number, unit: Unit, config: Config): number {
  switch (unit) {
    case 'px': return px;
    case 'rem': return px / config.baseFontSize;
    case 'em': return px / config.parentFontSize;
    case 'vh': return (px / config.viewportHeight) * 100;
    case 'vw': return (px / config.viewportWidth) * 100;
    case '%': return (px / config.parentSize) * 100;
    default: return px;
  }
}

function convertAll(value: number, fromUnit: Unit, config: Config): Record<Unit, number> {
  const px = toPx(value, fromUnit, config);
  const result = {} as Record<Unit, number>;
  for (const unit of UNITS) {
    result[unit] = fromPx(px, unit, config);
  }
  return result;
}

function formatValue(n: number): string {
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 100) return n.toFixed(1);
  if (Math.abs(n) >= 10) return n.toFixed(2);
  return n.toFixed(4).replace(/\.?0+$/, '');
}

export function CssUnitConverter() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('16');
  const [fromUnit, setFromUnit] = useState<Unit>('px');
  const [config, setConfig] = useState<Config>({
    baseFontSize: 16,
    viewportWidth: 1440,
    viewportHeight: 900,
    parentFontSize: 16,
    parentSize: 1440,
  });

  const numericValue = parseFloat(inputValue) || 0;
  const converted = convertAll(numericValue, fromUnit, config);

  const copyValue = useCallback((value: number, unit: Unit) => {
    const text = `${formatValue(value)}${unit}`;
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  }, [t]);

  const updateConfig = (key: keyof Config, raw: string) => {
    const n = parseFloat(raw);
    if (!isNaN(n) && n > 0) {
      setConfig((prev) => ({ ...prev, [key]: n }));
    }
  };

  const TABLE_INPUTS = [1, 4, 8, 16, 24, 32, 48, 64, 80, 96, 128, 192, 256, 320, 384, 512];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.cssConverter.title')}</h2>

      {/* Config Panel */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('tools.cssConverter.config')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{t('tools.cssConverter.baseFontSize')} (rem base)</Label>
            <Input
              type="number"
              value={config.baseFontSize}
              onChange={(e) => updateConfig('baseFontSize', e.target.value)}
              className="font-mono"
              min={1}
              data-testid="base-font-size"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('tools.cssConverter.viewportWidth')} (vw base)</Label>
            <Input
              type="number"
              value={config.viewportWidth}
              onChange={(e) => updateConfig('viewportWidth', e.target.value)}
              className="font-mono"
              min={1}
              data-testid="viewport-width"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('tools.cssConverter.viewportHeight')} (vh base)</Label>
            <Input
              type="number"
              value={config.viewportHeight}
              onChange={(e) => updateConfig('viewportHeight', e.target.value)}
              className="font-mono"
              min={1}
              data-testid="viewport-height"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('tools.cssConverter.parentFontSize')} (em base)</Label>
            <Input
              type="number"
              value={config.parentFontSize}
              onChange={(e) => updateConfig('parentFontSize', e.target.value)}
              className="font-mono"
              min={1}
              data-testid="parent-font-size"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('tools.cssConverter.parentSize')} (% base)</Label>
            <Input
              type="number"
              value={config.parentSize}
              onChange={(e) => updateConfig('parentSize', e.target.value)}
              className="font-mono"
              min={1}
              data-testid="parent-size"
            />
          </div>
        </div>
      </div>

      {/* Converter */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tools.cssConverter.convert')}</h3>

        <div className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label>{t('common.input')}</Label>
            <Input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono w-32"
              data-testid="value-input"
            />
          </div>
          <div className="space-y-1">
            <Label>{t('tools.cssConverter.fromUnit')}</Label>
            <div className="flex gap-1">
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setFromUnit(u)}
                  className={`px-3 py-2 text-sm font-mono rounded border transition-colors ${
                    fromUnit === u
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                  data-testid={`unit-btn-${u}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {UNITS.map((unit) => (
            <div
              key={unit}
              className={`p-3 rounded-lg border ${
                unit === fromUnit
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{unit}</span>
                <button
                  onClick={() => copyValue(converted[unit], unit)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('common.copy')}
                </button>
              </div>
              <div
                className="font-mono text-lg font-bold text-gray-900 dark:text-white"
                data-testid={`result-${unit}`}
              >
                {formatValue(converted[unit])}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tools.cssConverter.table')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {UNITS.map((u) => (
                  <th key={u} className="px-3 py-2 text-left border border-gray-300 dark:border-gray-600 font-mono font-semibold">
                    {u}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_INPUTS.map((px) => {
                const row = convertAll(px, 'px', config);
                return (
                  <tr key={px} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {UNITS.map((u) => (
                      <td
                        key={u}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 font-mono text-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => copyValue(row[u], u)}
                        title={`Copy ${formatValue(row[u])}${u}`}
                      >
                        {formatValue(row[u])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{t('tools.cssConverter.tableHint')}</p>
      </div>
    </div>
  );
}

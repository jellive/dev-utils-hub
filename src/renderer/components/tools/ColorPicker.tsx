import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100, ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

function generatePalette(hex: string): { label: string; colors: string[] } [] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const hsl = rgbToHsl(rgb);

  const complementary = rgbToHex(hslToRgb({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }));

  const analogous = [
    rgbToHex(hslToRgb({ h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l })),
    hex,
    rgbToHex(hslToRgb({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l })),
  ];

  const triadic = [
    hex,
    rgbToHex(hslToRgb({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l })),
    rgbToHex(hslToRgb({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l })),
  ];

  return [
    { label: 'Complementary', colors: [hex, complementary] },
    { label: 'Analogous', colors: analogous },
    { label: 'Triadic', colors: triadic },
  ];
}

export function ColorPicker() {
  const { t } = useTranslation();
  const [hex, setHex] = useState('#3b82f6');
  const [hexInput, setHexInput] = useState('#3b82f6');
  const [rgbInput, setRgbInput] = useState('');
  const [hslInput, setHslInput] = useState('');

  const updateFromHex = useCallback((value: string) => {
    const rgb = hexToRgb(value);
    if (!rgb) return;
    const hsl = rgbToHsl(rgb);
    setHex(value.startsWith('#') ? value : '#' + value);
    setHexInput(value.startsWith('#') ? value : '#' + value);
    setRgbInput(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
    setHslInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
  }, []);

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHex(value);
    setHexInput(value);
    updateFromHex(value.replace('#', ''));
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHexInput(value);
    const cleaned = value.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
      updateFromHex(cleaned);
    }
  };

  const handleRgbInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRgbInput(value);
    const match = value.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (match) {
      const rgb: RGB = { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
      if ([rgb.r, rgb.g, rgb.b].every((v) => v >= 0 && v <= 255)) {
        const newHex = rgbToHex(rgb);
        setHex(newHex);
        setHexInput(newHex);
        const hsl = rgbToHsl(rgb);
        setHslInput(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      }
    }
  };

  const handleHslInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHslInput(value);
    const match = value.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
    if (match) {
      const hsl: HSL = { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
      if (hsl.h >= 0 && hsl.h <= 360 && hsl.s >= 0 && hsl.s <= 100 && hsl.l >= 0 && hsl.l <= 100) {
        const rgb = hslToRgb(hsl);
        const newHex = rgbToHex(rgb);
        setHex(newHex);
        setHexInput(newHex);
        setRgbInput(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
      }
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };

  const palette = generatePalette(hex);
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb) : null;
  const hexDisplay = hex;
  const rgbDisplay = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
  const hslDisplay = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.colorPicker.title')}</h2>

      {/* Color Picker */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-2">
          <input
            type="color"
            value={hex}
            onChange={handlePickerChange}
            className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
            aria-label="Color picker"
            data-testid="color-picker-input"
          />
          <div
            className="w-20 h-8 rounded border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: hex }}
            aria-label="Color preview"
            data-testid="color-preview"
          />
        </div>

        <div className="flex-1 space-y-3">
          {/* HEX */}
          <div className="flex items-center gap-2">
            <Label className="w-12 text-sm font-mono">HEX</Label>
            <Input
              value={hexInput}
              onChange={handleHexInput}
              placeholder="#3b82f6"
              className="font-mono flex-1"
              data-testid="hex-input"
            />
            <button
              onClick={() => copy(hexDisplay)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              {t('common.copy')}
            </button>
          </div>

          {/* RGB */}
          <div className="flex items-center gap-2">
            <Label className="w-12 text-sm font-mono">RGB</Label>
            <Input
              value={rgbInput}
              onChange={handleRgbInput}
              placeholder="rgb(59, 130, 246)"
              className="font-mono flex-1"
              data-testid="rgb-input"
            />
            <button
              onClick={() => copy(rgbDisplay)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              {t('common.copy')}
            </button>
          </div>

          {/* HSL */}
          <div className="flex items-center gap-2">
            <Label className="w-12 text-sm font-mono">HSL</Label>
            <Input
              value={hslInput}
              onChange={handleHslInput}
              placeholder="hsl(217, 91%, 60%)"
              className="font-mono flex-1"
              data-testid="hsl-input"
            />
            <button
              onClick={() => copy(hslDisplay)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              {t('common.copy')}
            </button>
          </div>
        </div>
      </div>

      {/* Palette */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tools.colorPicker.palette')}</h3>
        {palette.map(({ label, colors }) => (
          <div key={label} className="space-y-1">
            <Label className="text-sm text-muted-foreground">{label}</Label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    updateFromHex(color.replace('#', ''));
                    copy(color);
                  }}
                  title={color}
                  className="flex-1 h-10 rounded border border-gray-300 dark:border-gray-600 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {t('tools.colorPicker.info')}
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>HEX</strong>: #{rgb ? [rgb.r, rgb.g, rgb.b].map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase() : ''}</li>
          <li>• <strong>RGB</strong>: {rgbDisplay}</li>
          <li>• <strong>HSL</strong>: {hslDisplay}</li>
        </ul>
      </div>
    </div>
  );
}

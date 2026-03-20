/**
 * i18n key validation tests.
 * Verifies that en.json and ko.json have identical key sets and no empty/null values,
 * for both the main locale files and the SentryToolkit locale files.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadJson(filePath: string): Record<string, unknown> {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Recursively collect all leaf key paths from a nested object.
 * Example: { a: { b: 'v' } } → ['a.b']
 */
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') {
    return [prefix];
  }
  const result: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...flattenKeys(v, path));
    } else {
      result.push(path);
    }
  }
  return result;
}

/**
 * Collect all leaf key paths that have empty string or null values.
 */
function findEmptyValues(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') {
    if (obj === null || obj === '') return [prefix];
    return [];
  }
  const result: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result.push(...findEmptyValues(v, path));
    } else if (v === null || v === '') {
      result.push(path);
    }
  }
  return result;
}

// ── Locale paths ─────────────────────────────────────────────────────────────

const MAIN_EN = resolve(
  __dirname,
  '../../renderer/i18n/locales/en.json'
);
const MAIN_KO = resolve(
  __dirname,
  '../../renderer/i18n/locales/ko.json'
);
const SENTRY_EN = resolve(
  __dirname,
  '../../renderer/components/tools/SentryToolkit/locales/en.json'
);
const SENTRY_KO = resolve(
  __dirname,
  '../../renderer/components/tools/SentryToolkit/locales/ko.json'
);

// ── Test suites ───────────────────────────────────────────────────────────────

describe('i18n key validation — main locales (src/renderer/i18n/locales)', () => {
  const en = loadJson(MAIN_EN);
  const ko = loadJson(MAIN_KO);
  const enKeys = flattenKeys(en).sort();
  const koKeys = flattenKeys(ko).sort();

  it('en.json and ko.json have the same number of keys', () => {
    expect(koKeys.length).toBe(enKeys.length);
  });

  it('all keys in en.json are present in ko.json', () => {
    const missingInKo = enKeys.filter((k) => !koKeys.includes(k));
    expect(missingInKo).toEqual([]);
  });

  it('all keys in ko.json are present in en.json', () => {
    const missingInEn = koKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it('en.json has no empty or null values', () => {
    const empty = findEmptyValues(en);
    expect(empty).toEqual([]);
  });

  it('ko.json has no empty or null values', () => {
    const empty = findEmptyValues(ko);
    expect(empty).toEqual([]);
  });
});

describe('i18n key validation — SentryToolkit locales', () => {
  const en = loadJson(SENTRY_EN);
  const ko = loadJson(SENTRY_KO);
  const enKeys = flattenKeys(en).sort();
  const koKeys = flattenKeys(ko).sort();

  it('en.json and ko.json have the same number of keys', () => {
    expect(koKeys.length).toBe(enKeys.length);
  });

  it('all keys in en.json are present in ko.json', () => {
    const missingInKo = enKeys.filter((k) => !koKeys.includes(k));
    expect(missingInKo).toEqual([]);
  });

  it('all keys in ko.json are present in en.json', () => {
    const missingInEn = koKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it('en.json has no empty or null values', () => {
    const empty = findEmptyValues(en);
    expect(empty).toEqual([]);
  });

  it('ko.json has no empty or null values', () => {
    const empty = findEmptyValues(ko);
    expect(empty).toEqual([]);
  });
});

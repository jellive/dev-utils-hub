import { describe, it, expect } from 'vitest';
import {
  convertToText,
  convertToJSON,
  convertToCSV,
  getFileExtension,
  generateFileName,
  convertToFormat,
} from '../exportFormats';
import type { HistoryEntry } from '../../../preload/index.d';

function makeEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 1,
    tool: 'test-tool',
    input: 'hello',
    output: 'world',
    metadata: undefined,
    favorite: 0,
    created_at: 1700000000,
    ...overrides,
  };
}

describe('exportFormats', () => {
  describe('convertToText', () => {
    it('returns empty string for empty array', () => {
      expect(convertToText([])).toBe('');
    });

    it('returns input values joined by newlines without metadata', () => {
      const entries = [makeEntry({ input: 'a' }), makeEntry({ input: 'b' })];
      expect(convertToText(entries)).toBe('a\nb');
    });

    it('returns input only (no metadata) by default', () => {
      const entry = makeEntry({ input: 'test', favorite: 1, created_at: 1700000000 });
      const result = convertToText([entry], false);
      expect(result).toBe('test');
    });

    it('includes favorite star and date with metadata=true', () => {
      const entry = makeEntry({ input: 'myval', favorite: 1, created_at: 1700000000 });
      const result = convertToText([entry], true);
      expect(result).toContain('⭐');
      expect(result).toContain('myval');
    });

    it('omits star for non-favorite with metadata=true', () => {
      const entry = makeEntry({ input: 'myval', favorite: 0, created_at: 1700000000 });
      const result = convertToText([entry], true);
      expect(result).not.toContain('⭐');
      expect(result).toContain('myval');
    });

    it('handles missing created_at gracefully', () => {
      const entry = makeEntry({ input: 'val', created_at: undefined });
      const result = convertToText([entry], true);
      expect(result).toContain('val');
    });
  });

  describe('convertToJSON', () => {
    it('returns "[]" for empty array', () => {
      expect(convertToJSON([])).toBe('[]');
    });

    it('returns simplified format without metadata', () => {
      const entry = makeEntry({ input: 'in', output: 'out' });
      const result = convertToJSON([entry], false);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual({ input: 'in', output: 'out' });
      expect(parsed[0]).not.toHaveProperty('id');
    });

    it('uses empty string for missing output in simplified format', () => {
      const entry = makeEntry({ input: 'in', output: undefined });
      const result = convertToJSON([entry], false);
      const parsed = JSON.parse(result);
      expect(parsed[0].output).toBe('');
    });

    it('returns full entries with includeMetadata=true', () => {
      const entry = makeEntry({ id: 42, input: 'in', output: 'out', tool: 'mytool' });
      const result = convertToJSON([entry], true);
      const parsed = JSON.parse(result);
      expect(parsed[0].id).toBe(42);
      expect(parsed[0].tool).toBe('mytool');
    });

    it('produces valid JSON', () => {
      const entries = [makeEntry(), makeEntry({ input: 'second' })];
      expect(() => JSON.parse(convertToJSON(entries))).not.toThrow();
    });
  });

  describe('convertToCSV', () => {
    it('returns empty string for empty array', () => {
      expect(convertToCSV([])).toBe('');
    });

    it('returns Input,Output header without metadata', () => {
      const entry = makeEntry({ input: 'a', output: 'b' });
      const result = convertToCSV([entry], false);
      expect(result.startsWith('Input,Output\n')).toBe(true);
    });

    it('escapes double quotes in values', () => {
      const entry = makeEntry({ input: 'say "hello"', output: 'ok' });
      const result = convertToCSV([entry], false);
      expect(result).toContain('""hello""');
    });

    it('replaces newlines with spaces in CSV values', () => {
      const entry = makeEntry({ input: 'line1\nline2', output: 'out' });
      const result = convertToCSV([entry], false);
      expect(result).not.toContain('\nline2');
      expect(result).toContain('line1 line2');
    });

    it('handles undefined output as empty quoted string', () => {
      const entry = makeEntry({ input: 'in', output: undefined });
      const result = convertToCSV([entry], false);
      expect(result).toContain('""');
    });

    it('returns full CSV with metadata header', () => {
      const entry = makeEntry();
      const result = convertToCSV([entry], true);
      expect(result.startsWith('ID,Tool,Input,Output,Favorite,Created At\n')).toBe(true);
    });

    it('marks favorite as Yes/No in metadata format', () => {
      const fav = makeEntry({ favorite: 1 });
      const nonFav = makeEntry({ favorite: 0 });
      const favResult = convertToCSV([fav], true);
      const nonFavResult = convertToCSV([nonFav], true);
      expect(favResult).toContain('"Yes"');
      expect(nonFavResult).toContain('"No"');
    });
  });

  describe('getFileExtension', () => {
    it('returns txt for txt format', () => {
      expect(getFileExtension('txt')).toBe('txt');
    });

    it('returns json for json format', () => {
      expect(getFileExtension('json')).toBe('json');
    });

    it('returns csv for csv format', () => {
      expect(getFileExtension('csv')).toBe('csv');
    });
  });

  describe('generateFileName', () => {
    it('includes tool name and format extension', () => {
      const name = generateFileName('timestamp', 'json');
      expect(name).toMatch(/^timestamp-export-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('generates different extensions for different formats', () => {
      expect(generateFileName('tool', 'txt')).toMatch(/\.txt$/);
      expect(generateFileName('tool', 'csv')).toMatch(/\.csv$/);
    });
  });

  describe('convertToFormat', () => {
    it('dispatches to convertToText for txt', () => {
      const entries = [makeEntry({ input: 'hi' })];
      expect(convertToFormat(entries, 'txt')).toBe('hi');
    });

    it('dispatches to convertToJSON for json', () => {
      const entries = [makeEntry({ input: 'hi', output: 'there' })];
      const result = convertToFormat(entries, 'json');
      const parsed = JSON.parse(result);
      expect(parsed[0].input).toBe('hi');
    });

    it('dispatches to convertToCSV for csv', () => {
      const entries = [makeEntry()];
      const result = convertToFormat(entries, 'csv');
      expect(result).toContain('Input,Output');
    });

    it('passes includeMetadata flag through', () => {
      const entries = [makeEntry({ favorite: 1, created_at: 1700000000 })];
      const result = convertToFormat(entries, 'txt', true);
      expect(result).toContain('⭐');
    });
  });
});

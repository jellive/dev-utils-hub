import { describe, it, expect } from 'vitest';
import { diffLines } from '../diffAlgorithm';

describe('diffAlgorithm', () => {
  describe('diffLines', () => {
    it('should identify identical texts', () => {
      const text1 = 'Hello\nWorld';
      const text2 = 'Hello\nWorld';

      const result = diffLines(text1, text2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'equal', value: 'Hello', oldIndex: 0, newIndex: 0 });
      expect(result[1]).toEqual({ type: 'equal', value: 'World', oldIndex: 1, newIndex: 1 });
    });

    it('should identify added lines', () => {
      const text1 = 'Hello';
      const text2 = 'Hello\nWorld';

      const result = diffLines(text1, text2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'equal', value: 'Hello', oldIndex: 0, newIndex: 0 });
      expect(result[1]).toEqual({ type: 'insert', value: 'World', oldIndex: undefined, newIndex: 1 });
    });

    it('should identify deleted lines', () => {
      const text1 = 'Hello\nWorld';
      const text2 = 'Hello';

      const result = diffLines(text1, text2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'equal', value: 'Hello', oldIndex: 0, newIndex: 0 });
      expect(result[1]).toEqual({ type: 'delete', value: 'World', oldIndex: 1, newIndex: undefined });
    });

    it('should identify modified lines', () => {
      const text1 = 'Hello World';
      const text2 = 'Hello Universe';

      const result = diffLines(text1, text2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'delete', value: 'Hello World', oldIndex: 0, newIndex: undefined });
      expect(result[1]).toEqual({ type: 'insert', value: 'Hello Universe', oldIndex: undefined, newIndex: 0 });
    });

    it('should handle empty strings', () => {
      const text1 = '';
      const text2 = '';

      const result = diffLines(text1, text2);

      expect(result).toHaveLength(0);
    });

    it('should handle one empty string', () => {
      const text1 = '';
      const text2 = 'Hello\nWorld';

      const result = diffLines(text1, text2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'insert', value: 'Hello', oldIndex: undefined, newIndex: 0 });
      expect(result[1]).toEqual({ type: 'insert', value: 'World', oldIndex: undefined, newIndex: 1 });
    });

    it('should handle complex diff with multiple changes', () => {
      const text1 = 'Line 1\nLine 2\nLine 3\nLine 4';
      const text2 = 'Line 1\nModified Line 2\nLine 3\nLine 5';

      const result = diffLines(text1, text2);

      expect(result.some(r => r.type === 'equal' && r.value === 'Line 1')).toBe(true);
      expect(result.some(r => r.type === 'delete' && r.value === 'Line 2')).toBe(true);
      expect(result.some(r => r.type === 'insert' && r.value === 'Modified Line 2')).toBe(true);
      expect(result.some(r => r.type === 'equal' && r.value === 'Line 3')).toBe(true);
      expect(result.some(r => r.type === 'delete' && r.value === 'Line 4')).toBe(true);
      expect(result.some(r => r.type === 'insert' && r.value === 'Line 5')).toBe(true);
    });

    it('should preserve line order', () => {
      const text1 = 'A\nB\nC';
      const text2 = 'A\nD\nC';

      const result = diffLines(text1, text2);

      const types = result.map(r => r.type);
      const firstEqualIndex = types.indexOf('equal');
      const deleteIndex = types.indexOf('delete');
      const insertIndex = types.indexOf('insert');
      const lastEqualIndex = types.lastIndexOf('equal');

      expect(firstEqualIndex).toBeLessThan(deleteIndex);
      expect(deleteIndex).toBeLessThan(insertIndex);
      expect(insertIndex).toBeLessThan(lastEqualIndex);
    });
  });
});

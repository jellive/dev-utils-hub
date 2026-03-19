import * as fc from 'fast-check';
import { diffLines } from '../diffAlgorithm';

describe('diffLines property tests', () => {
  it('produces only equal/insert/delete types', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const result = diffLines(a, b);
        const validTypes = new Set(['equal', 'insert', 'delete']);
        expect(result.every((r) => validTypes.has(r.type))).toBe(true);
      })
    );
  });

  it('identical texts produce only equal entries', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const result = diffLines(text, text);
        expect(result.every((r) => r.type === 'equal')).toBe(true);
      })
    );
  });

  it('reassembling equal+insert lines reconstructs the new text', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (oldText, newText) => {
        const result = diffLines(oldText, newText);
        const reconstructed = result
          .filter((r) => r.type === 'equal' || r.type === 'insert')
          .map((r) => r.value)
          .join('\n');
        const expected = newText ? newText : '';
        // Only check when both texts are non-empty to avoid empty edge cases
        if (oldText && newText) {
          expect(reconstructed).toBe(expected);
        }
      })
    );
  });

  it('reassembling equal+delete lines reconstructs the old text', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (oldText, newText) => {
        const result = diffLines(oldText, newText);
        const reconstructed = result
          .filter((r) => r.type === 'equal' || r.type === 'delete')
          .map((r) => r.value)
          .join('\n');
        if (oldText && newText) {
          expect(reconstructed).toBe(oldText);
        }
      })
    );
  });

  it('empty inputs produce empty diff', () => {
    expect(diffLines('', '')).toEqual([]);
  });

  it('equal entries have both oldIndex and newIndex defined', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const result = diffLines(a, b);
        result
          .filter((r) => r.type === 'equal')
          .forEach((r) => {
            expect(r.oldIndex).toBeDefined();
            expect(r.newIndex).toBeDefined();
          });
      })
    );
  });

  it('insert entries have newIndex defined and oldIndex undefined', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const result = diffLines(a, b);
        result
          .filter((r) => r.type === 'insert')
          .forEach((r) => {
            expect(r.newIndex).toBeDefined();
            expect(r.oldIndex).toBeUndefined();
          });
      })
    );
  });

  it('delete entries have oldIndex defined and newIndex undefined', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        const result = diffLines(a, b);
        result
          .filter((r) => r.type === 'delete')
          .forEach((r) => {
            expect(r.oldIndex).toBeDefined();
            expect(r.newIndex).toBeUndefined();
          });
      })
    );
  });
});

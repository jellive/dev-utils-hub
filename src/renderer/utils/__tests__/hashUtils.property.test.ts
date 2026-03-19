import * as fc from 'fast-check';
import { md5, generateHash } from '../hashUtils';

describe('hashUtils property tests', () => {
  describe('md5', () => {
    it('always produces a 32-character hex string', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          const result = await md5(input);
          expect(result).toMatch(/^[0-9a-f]{32}$/);
        })
      );
    });

    it('is deterministic - same input produces same output', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          const r1 = await md5(input);
          const r2 = await md5(input);
          expect(r1).toBe(r2);
        })
      );
    });

    it('different inputs (usually) produce different hashes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          async (a, b) => {
            if (a === b) return; // skip equal inputs
            const ha = await md5(a);
            const hb = await md5(b);
            expect(ha).not.toBe(hb);
          }
        )
      );
    });
  });

  describe('generateHash', () => {
    it('md5 always produces 32-char hex', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          const result = await generateHash(input, 'md5');
          expect(result).toMatch(/^[0-9a-f]{32}$/);
        })
      );
    });

    it('sha256 always produces 64-char hex', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          const result = await generateHash(input, 'sha256');
          expect(result).toMatch(/^[0-9a-f]{64}$/);
        })
      );
    });

    it('sha512 always produces 128-char hex', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (input) => {
          const result = await generateHash(input, 'sha512');
          expect(result).toMatch(/^[0-9a-f]{128}$/);
        })
      );
    });

    it('is deterministic across all algorithms', async () => {
      const algorithms = ['md5', 'sha256', 'sha512'] as const;
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.constantFrom(...algorithms),
          async (input, algo) => {
            const r1 = await generateHash(input, algo);
            const r2 = await generateHash(input, algo);
            expect(r1).toBe(r2);
          }
        )
      );
    });
  });
});

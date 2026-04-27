import { describe, it, expect } from 'vitest';
import { benchmark } from '@/lib/crypto/benchmark';

describe('benchmark', () => {
  it('returns totalMs / avgMs / opsPerSec for a sync-style fn', async () => {
    const result = await benchmark(async () => 'hash', 100);
    expect(result.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.avgMs).toBeGreaterThanOrEqual(0);
    expect(result.opsPerSec).toBeGreaterThan(0);
  });

  it('avgMs equals totalMs / iterations', async () => {
    const result = await benchmark(async () => 'x', 50);
    expect(result.avgMs).toBeCloseTo(result.totalMs / 50, 5);
  });

  it('opsPerSec equals iterations / totalMs * 1000', async () => {
    const result = await benchmark(async () => 'x', 100);
    expect(result.opsPerSec).toBeCloseTo((100 / result.totalMs) * 1000, 5);
  });

  it('uses 1000 iterations by default', async () => {
    let counter = 0;
    await benchmark(async () => {
      counter++;
      return 'x';
    });
    expect(counter).toBe(1000);
  });

  it('respects custom iteration count', async () => {
    let counter = 0;
    await benchmark(async () => {
      counter++;
      return 'x';
    }, 5);
    expect(counter).toBe(5);
  });
});

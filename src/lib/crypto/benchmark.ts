export interface BenchmarkResult {
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

export async function benchmark(
  fn: () => Promise<string>,
  iterations = 1000
): Promise<BenchmarkResult> {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) await fn();
  const totalMs = performance.now() - start;
  return {
    totalMs,
    avgMs: totalMs / iterations,
    opsPerSec: (iterations / totalMs) * 1000,
  };
}

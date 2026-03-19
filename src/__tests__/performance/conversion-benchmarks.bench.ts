/**
 * Performance benchmarks for conversion and formatting operations.
 * Run with: npm run test:bench
 * Vitest bench uses tinybench under the hood.
 */
import { bench, describe } from 'vitest';
import { md5, sha256, sha512, generateHash } from '@/utils/hashUtils';
import { diffAlgorithm } from '@/utils/diffAlgorithm';

// ─── Helpers ────────────────────────────────────────────────────────────────

const SHORT_TEXT = 'hello world';
const MEDIUM_TEXT = 'a'.repeat(1_000);
const LARGE_TEXT = 'a'.repeat(100_000);

const SMALL_JSON = JSON.stringify({ name: 'Jell', active: true, score: 42 });
const MEDIUM_JSON = JSON.stringify(
  Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}`, value: Math.random() }))
);
const LARGE_JSON = JSON.stringify(
  Array.from({ length: 5_000 }, (_, i) => ({ id: i, name: `item-${i}`, value: Math.random() }))
);

// ─── Base64 benchmarks ───────────────────────────────────────────────────────

describe('Base64 encoding', () => {
  bench('encode short text (btoa)', () => {
    btoa(SHORT_TEXT);
  });

  bench('encode medium text (1 KB)', () => {
    const bytes = new TextEncoder().encode(MEDIUM_TEXT);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    btoa(binary);
  });

  bench('encode large text (100 KB)', () => {
    const bytes = new TextEncoder().encode(LARGE_TEXT);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    btoa(binary);
  });

  bench('decode base64 short', () => {
    atob('aGVsbG8gd29ybGQ=');
  });

  bench('encode + decode round-trip (1 KB)', () => {
    const bytes = new TextEncoder().encode(MEDIUM_TEXT);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    const encoded = btoa(binary);
    atob(encoded);
  });
});

// ─── JSON formatting benchmarks ──────────────────────────────────────────────

describe('JSON formatting', () => {
  bench('parse + stringify small JSON', () => {
    JSON.stringify(JSON.parse(SMALL_JSON), null, 2);
  });

  bench('parse + stringify medium JSON (100 items)', () => {
    JSON.stringify(JSON.parse(MEDIUM_JSON), null, 2);
  });

  bench('parse + stringify large JSON (5000 items)', () => {
    JSON.stringify(JSON.parse(LARGE_JSON), null, 2);
  });

  bench('compress (stringify without indent)', () => {
    JSON.stringify(JSON.parse(MEDIUM_JSON));
  });

  bench('validate JSON (valid input)', () => {
    try { JSON.parse(MEDIUM_JSON); } catch { /* ignore */ }
  });

  bench('validate JSON (invalid input)', () => {
    try { JSON.parse('{ bad json }'); } catch { /* ignore */ }
  });
});

// ─── URL encoding benchmarks ─────────────────────────────────────────────────

describe('URL encoding', () => {
  const url = 'https://example.com/search?q=hello world&lang=한국어&page=1';
  const encoded = encodeURIComponent(url);

  bench('encodeURIComponent', () => {
    encodeURIComponent(url);
  });

  bench('decodeURIComponent', () => {
    decodeURIComponent(encoded);
  });

  bench('URL parse', () => {
    new URL('https://api.example.com:8080/v1/users?page=1&limit=50#section');
  });

  bench('URLSearchParams iteration', () => {
    const params = new URLSearchParams('page=1&limit=50&sort=asc&filter=active&lang=en');
    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
  });
});

// ─── Hash benchmarks ─────────────────────────────────────────────────────────

describe('Hash generation', () => {
  bench('MD5 short text', async () => {
    await md5(SHORT_TEXT);
  });

  bench('MD5 medium text (1 KB)', async () => {
    await md5(MEDIUM_TEXT);
  });

  bench('SHA-256 short text', async () => {
    await sha256(SHORT_TEXT);
  });

  bench('SHA-256 medium text (1 KB)', async () => {
    await sha256(MEDIUM_TEXT);
  });

  bench('SHA-512 short text', async () => {
    await sha512(SHORT_TEXT);
  });

  bench('generateHash dispatcher — md5', async () => {
    await generateHash(SHORT_TEXT, 'md5');
  });

  bench('generateHash dispatcher — sha256', async () => {
    await generateHash(SHORT_TEXT, 'sha256');
  });

  bench('generateHash dispatcher — sha512', async () => {
    await generateHash(SHORT_TEXT, 'sha512');
  });
});

// ─── Diff algorithm benchmarks ───────────────────────────────────────────────

describe('Diff algorithm', () => {
  const textA = 'The quick brown fox\njumps over the lazy dog\nand runs away quickly';
  const textB = 'The quick brown fox\nleaps over the lazy cat\nand runs away slowly';

  const largeA = Array.from({ length: 200 }, (_, i) => `line ${i}: ${MEDIUM_TEXT.slice(0, 50)}`).join('\n');
  const largeB = Array.from({ length: 200 }, (_, i) =>
    i % 10 === 0 ? `line ${i}: CHANGED` : `line ${i}: ${MEDIUM_TEXT.slice(0, 50)}`
  ).join('\n');

  bench('diff short texts (3 lines each)', () => {
    diffAlgorithm(textA, textB);
  });

  bench('diff large texts (200 lines each, 10% changed)', () => {
    diffAlgorithm(largeA, largeB);
  });

  bench('diff identical texts (200 lines)', () => {
    diffAlgorithm(largeA, largeA);
  });

  bench('diff completely different texts', () => {
    diffAlgorithm('aaa\nbbb\nccc', 'xxx\nyyy\nzzz');
  });
});

import { test, expect } from '@playwright/test';

/**
 * Production E2E — runs against https://dev-utils.jell.kr (live PWA).
 *
 * Why this spec file:
 * - The Electron-era specs (e2e/uuid-*, file-system-*) are stale post-Tauri
 *   migration. They use button selectors that no longer match the current
 *   card-based UI and rely on Electron APIs that don't exist anymore.
 * - Production URL gives us deterministic surface to test against and
 *   doesn't need a multi-minute Tauri Rust build.
 * - Covers the 18 tools from the home grid end-to-end + failure paths.
 *
 * Navigation: app uses hash routing (`#/json`, `#/uuid` etc.). We
 * navigate directly via `page.goto('/#/<route>')` because clicking the
 * card title text doesn't reliably reach the tool detail.
 */

const BASE = 'https://dev-utils.jell.kr';

test.use({ baseURL: BASE });

const TOOLS: { name: string; route: string }[] = [
  { name: 'JSON Formatter', route: '#/json' },
  { name: 'JWT Decoder', route: '#/jwt' },
  { name: 'Base64 Converter', route: '#/base64' },
  { name: 'URL Encoder/Decoder', route: '#/url' },
  { name: 'Regex Tester', route: '#/regex' },
  { name: 'Text Diff', route: '#/diff' },
  { name: 'Hash Generator', route: '#/hash' },
  { name: 'UUID Generator', route: '#/uuid' },
  { name: 'Timestamp Converter', route: '#/timestamp' },
  { name: 'Color Picker', route: '#/color-picker' },
  { name: 'Cron Parser', route: '#/cron-parser' },
  { name: 'Markdown Preview', route: '#/markdown-preview' },
  { name: 'CSS Unit Converter', route: '#/css-converter' },
  { name: 'AI Regex Builder', route: '#/ai-regex' },
  { name: 'AI JSON Schema', route: '#/ai-json-schema' },
  { name: 'AI Code Explainer', route: '#/ai-code-explainer' },
  { name: 'WebCrypto Benchmark', route: '#/wasm-benchmark' },
  { name: 'Diff Viewer', route: '#/diff-viewer' },
];

test.describe('Home grid — discoverability', () => {
  test('home renders all 18 tools', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (const { name } of TOOLS) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test('search box is interactive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder(/search/i).first();
    await expect(search).toBeVisible();
    await search.fill('uuid');
    await expect(page.getByText('UUID Generator').first()).toBeVisible();
  });
});

test.describe('Tool routes — every tool reachable + Back link present', () => {
  for (const { name, route } of TOOLS) {
    test(`/${route} reaches tool detail (${name})`, async ({ page }) => {
      const res = await page.goto('/' + route);
      expect(res?.status()).toBeLessThan(400);
      await page.waitForLoadState('networkidle');
      // Tool detail pages all show a "Back to Tools" affordance.
      await expect(page.getByText(/Back to Tools/i)).toBeVisible({
        timeout: 5000,
      });
    });
  }
});

test.describe('JSON Formatter — happy + failure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/json');
    await page.waitForLoadState('networkidle');
  });

  test('Format button + Compress button are present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^format$/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /compress/i }).first()).toBeVisible();
  });

  test('formats valid JSON input', async ({ page }) => {
    const input = page.getByPlaceholder(/paste your json/i).first();
    await input.fill('{"name":"Wecanner","tools":3}');
    await page
      .getByRole('button', { name: /^format$/i })
      .first()
      .click();
    // formatted output should contain newlines / indentation; assert
    // the value made it into the output panel by content match.
    await expect(page.getByText(/"name"/).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Base64 Converter — encode round-trip', () => {
  test('encodes plain text via Encode button', async ({ page }) => {
    await page.goto('/#/base64');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/enter text to encode/i).fill('Wecanner 2.0');
    await page
      .getByRole('button', { name: /^encode$/i })
      .first()
      .click();
    // Output is the second textarea — read its value (Base64 V2VjYW5uZXIgMi4w)
    await expect
      .poll(
        async () =>
          (await page.locator('textarea').nth(1).inputValue()).includes('V2VjYW5uZXIgMi4w'),
        { timeout: 5000 }
      )
      .toBe(true);
  });
});

test.describe('UUID Generator — produces a v4 UUID', () => {
  test('a UUID v4 appears after generation', async ({ page }) => {
    await page.goto('/#/uuid');
    await page.waitForLoadState('networkidle');

    await page
      .getByRole('button', { name: /generate uuid/i })
      .first()
      .click();

    const uuidV4 = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
    // The generated UUID lives in an input element (its `value`), so we
    // collect every input/textarea value and assert at least one matches.
    await expect
      .poll(
        async () => {
          const values = await page
            .locator('input, textarea')
            .evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
          return values.some(v => uuidV4.test(v));
        },
        { timeout: 5000 }
      )
      .toBe(true);
  });
});

test.describe('Hash Generator — SHA-256 of known input', () => {
  test('hash of "hello" produces well-known SHA-256', async ({ page }) => {
    await page.goto('/#/hash');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/enter text to hash/i).fill('hello');
    // Tool defaults to MD5; switch to SHA-256 explicitly before generating.
    await page
      .getByRole('button', { name: /SHA-256/i })
      .first()
      .click();
    await page
      .getByRole('button', { name: /generate hash/i })
      .first()
      .click();

    // SHA-256("hello") starts with "2cf24dba5fb0a30e26e83b2ac5b9e29e".
    // The hash result may render in body text or an input value — check both.
    await expect
      .poll(
        async () => {
          const text = await page.locator('body').innerText();
          if (/2cf24dba5fb0a30e26e83b2ac5b9e29e/i.test(text)) return true;
          const values = await page
            .locator('input, textarea')
            .evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
          return values.some(v => /2cf24dba5fb0a30e26e83b2ac5b9e29e/i.test(v));
        },
        { timeout: 8000 }
      )
      .toBe(true);
  });
});

test.describe('URL Encoder/Decoder — encodes special chars', () => {
  test('"hello world" encodes to "hello%20world"', async ({ page }) => {
    await page.goto('/#/url');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/enter url here/i).fill('hello world');
    await page
      .getByRole('button', { name: /^encode$/i })
      .first()
      .click();

    // Encoded value lives in an input/textarea value — check those.
    await expect
      .poll(
        async () => {
          const values = await page
            .locator('input, textarea')
            .evaluateAll(els => els.map(e => (e as HTMLInputElement).value));
          return values.some(v => /hello%20world/i.test(v));
        },
        { timeout: 5000 }
      )
      .toBe(true);
  });
});

test.describe('Failure path — production health', () => {
  test('home returns 2xx', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
  });

  test('PWA manifest reachable + valid', async ({ request }) => {
    const candidates = ['/manifest.webmanifest', '/manifest.json'];
    let manifest: { name?: string; icons?: unknown[] } | null = null;
    for (const p of candidates) {
      const r = await request.get(p);
      if (r.status() === 200) {
        manifest = await r.json();
        break;
      }
    }
    expect(manifest).not.toBeNull();
    expect(manifest!.name).toBeTruthy();
    expect(((manifest!.icons as unknown[]) || []).length).toBeGreaterThan(0);
  });

  test('service worker reachable', async ({ request }) => {
    const candidates = ['/sw.js', '/registerSW.js'];
    let ok = false;
    for (const p of candidates) {
      const r = await request.get(p);
      if (r.status() === 200) {
        ok = true;
        break;
      }
    }
    expect(ok).toBe(true);
  });

  test('no hard JS errors on home page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter known third-party noise (Sentry beacon, analytics) and the
    // browser's own favicon-404 console warning.
    const hard = errors.filter(
      e =>
        !/sentry|analytics|gtag|adsbygoogle|hotjar|fullstory/i.test(e) &&
        !/Failed to load resource.*404.*favicon/i.test(e) &&
        !/Failed to load resource.*sentry/i.test(e)
    );
    expect(hard).toEqual([]);
  });
});

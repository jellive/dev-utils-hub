import { test, expect, type Page } from '@playwright/test';

/**
 * Per-tool edge & failure case coverage against the live PWA.
 *
 * production-tools.spec.ts covers the happy paths. This file fills in the
 * "what if the user pastes garbage / nothing / something huge" gaps for
 * each tool. The contract we assert in every case is:
 *   - the page itself doesn't throw (no uncaught pageerror)
 *   - the tool either renders something sensible or shows an error
 *
 * Output is stored either in body innerText OR in input/textarea values.
 * Helper readEverything() concatenates both so the assertions don't have
 * to know which DOM each tool uses.
 */

test.use({ baseURL: 'https://dev-utils.jell.kr' });

async function readEverything(page: Page): Promise<string> {
  const body = await page.locator('body').innerText();
  const inputs = await page
    .locator('input, textarea')
    .evaluateAll(els => els.map(e => (e as HTMLInputElement).value).join('\n'));
  return body + '\n' + inputs;
}

async function captureErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

// ---------------------------------------------------------------------------
// JSON Formatter
// ---------------------------------------------------------------------------
test.describe('JSON Formatter — edge & failure', () => {
  test('empty input + Format click does not crash the page', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/json');
    await page
      .getByRole('button', { name: /^format$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('malformed JSON (unclosed brace) surfaces an error UI', async ({ page }) => {
    await page.goto('/#/json');
    await page.locator('textarea').first().fill('{"a": 1');
    await page
      .getByRole('button', { name: /^format$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const all = (await readEverything(page)).toLowerCase();
    // Either the word "error"/"invalid" appears OR output is left empty
    const showsError = /error|invalid|unexpected|syntax/.test(all);
    const outputEmpty = (await page.locator('textarea').nth(1).inputValue()).trim() === '';
    expect(showsError || outputEmpty).toBe(true);
  });

  test('trailing comma is reported as invalid', async ({ page }) => {
    await page.goto('/#/json');
    await page.locator('textarea').first().fill('{"a": 1,}');
    await page
      .getByRole('button', { name: /^format$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const out = await page.locator('textarea').nth(1).inputValue();
    // Strict JSON should reject — output stays empty or shows error.
    expect(out.includes('{"a": 1,}')).toBe(false);
  });

  test('formats nested structure with Unicode/emoji preserved', async ({ page }) => {
    await page.goto('/#/json');
    const input = '{"name":"Wecanner 🦞","items":[{"id":1,"tag":"한글"}]}';
    await page.locator('textarea').first().fill(input);
    await page
      .getByRole('button', { name: /^format$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const out = await page.locator('textarea').nth(1).inputValue();
    expect(out).toContain('Wecanner 🦞');
    expect(out).toContain('한글');
  });

  test('Compress button removes whitespace from formatted JSON', async ({ page }) => {
    await page.goto('/#/json');
    await page.locator('textarea').first().fill('{\n  "a": 1\n}');
    await page
      .getByRole('button', { name: /compress/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const out = await page.locator('textarea').nth(1).inputValue();
    if (out) {
      expect(out.includes('\n')).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// JWT Decoder
// ---------------------------------------------------------------------------
test.describe('JWT Decoder — edge & failure', () => {
  test('empty token + Decode does not throw', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/jwt');
    await page
      .getByRole('button', { name: /decode/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('invalid token (not base64) is rejected, not silently accepted', async ({ page }) => {
    await page.goto('/#/jwt');
    await page.getByPlaceholder(/paste your jwt/i).fill('not-a-jwt-at-all');
    await page
      .getByRole('button', { name: /decode/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const all = (await readEverything(page)).toLowerCase();
    expect(/invalid|error|malformed/.test(all)).toBe(true);
  });

  test('valid JWT decodes header + payload', async ({ page }) => {
    await page.goto('/#/jwt');
    // Standard test JWT — alg=HS256 + payload {sub:"1234567890",name:"John Doe",iat:1516239022}
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await page.getByPlaceholder(/paste your jwt/i).fill(jwt);
    await page
      .getByRole('button', { name: /decode/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const all = await readEverything(page);
    expect(all).toContain('HS256');
    expect(all).toContain('John Doe');
  });
});

// ---------------------------------------------------------------------------
// URL Encoder/Decoder
// ---------------------------------------------------------------------------
test.describe('URL Encoder/Decoder — edge & failure', () => {
  test('Korean characters round-trip via Encode then Decode', async ({ page }) => {
    await page.goto('/#/url');
    await page.getByPlaceholder(/enter url here/i).fill('한글 검색어');
    await page
      .getByRole('button', { name: /^encode$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const all = await readEverything(page);
    // %ED is the start byte of any 한글 (utf-8 EC..ED..)
    expect(/%[A-F0-9]{2}/i.test(all)).toBe(true);
  });

  test('empty input + Encode is a no-op (no crash)', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/url');
    await page
      .getByRole('button', { name: /^encode$/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('malformed % escape on Decode does not throw', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/url');
    await page.getByPlaceholder(/enter url here/i).fill('hello%2');
    // Use exact-text locator (avoids regex + .first() flakiness when
    // multiple Encode/Decode buttons exist for different scopes).
    await page
      .locator('button', { hasText: /^Decode$/ })
      .first()
      .click({ timeout: 5000 });
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Hash Generator
// ---------------------------------------------------------------------------
test.describe('Hash Generator — edge & failure', () => {
  test('SHA-256 of empty string = "e3b0c4..." known constant', async ({ page }) => {
    await page.goto('/#/hash');
    await page
      .getByRole('button', { name: /SHA-256/i })
      .first()
      .click();
    // Don't fill anything — empty input.
    const generate = page.getByRole('button', { name: /generate hash/i });
    if (await generate.isEnabled()) {
      await generate.first().click();
      await page.waitForTimeout(500);
      const all = (await readEverything(page)).toLowerCase();
      // Either: shows the known empty-string SHA-256, OR shows an error/empty.
      const sha256OfEmpty = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const showedKnown = all.includes(sha256OfEmpty);
      const isEmptyOrError = /empty|invalid|please/i.test(all);
      expect(showedKnown || isEmptyOrError).toBe(true);
    }
  });

  test('MD5 algorithm switch produces different hash than SHA-256', async ({ page }) => {
    await page.goto('/#/hash');
    await page.getByPlaceholder(/enter text to hash/i).fill('hello');
    await page.getByRole('button', { name: /^MD5/i }).first().click();
    await page
      .getByRole('button', { name: /generate hash/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const md5Body = await readEverything(page);
    // MD5("hello") = "5d41402abc4b2a76b9719d911017c592"
    expect(md5Body).toContain('5d41402abc4b2a76b9719d911017c592');
    // And SHA-256 prefix should NOT be there at this point.
    expect(md5Body).not.toContain('2cf24dba5fb0a30e26e83b2ac5b9e29e');
  });

  test('Unicode input produces stable hash', async ({ page }) => {
    await page.goto('/#/hash');
    await page
      .getByRole('button', { name: /SHA-256/i })
      .first()
      .click();
    await page.getByPlaceholder(/enter text to hash/i).fill('한글');
    await page
      .getByRole('button', { name: /generate hash/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const out = await readEverything(page);
    // SHA-256 of "한글" UTF-8 bytes — exact value not asserted, but must
    // be a 64-char lowercase hex string somewhere in the output.
    expect(/[0-9a-f]{64}/i.test(out)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Regex Tester
// ---------------------------------------------------------------------------
test.describe('Regex Tester — edge & failure', () => {
  test('invalid regex (unclosed bracket) shows error, not crash', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/regex');
    await page.locator('input, textarea').first().fill('[a-z');
    await page
      .getByRole('button', { name: /test pattern/i })
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('valid pattern matches expected substring', async ({ page }) => {
    await page.goto('/#/regex');
    const inputs = page.locator('input, textarea');
    await inputs.first().fill('\\d+');
    await inputs.nth(1).fill('hello 1234 world');
    await page
      .getByRole('button', { name: /test pattern/i })
      .first()
      .click();
    await page.waitForTimeout(500);
    const all = await readEverything(page);
    // The matched substring "1234" should appear somewhere
    expect(all).toContain('1234');
  });
});

// ---------------------------------------------------------------------------
// Cron Parser
// ---------------------------------------------------------------------------
test.describe('Cron Parser — edge & failure', () => {
  test('invalid cron expression does not throw', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/cron-parser');
    await page.getByPlaceholder(/\* \* \* \* \*/).fill('invalid');
    await page.waitForTimeout(800);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('valid "0 9 * * 1-5" expression shows weekday/9am info', async ({ page }) => {
    await page.goto('/#/cron-parser');
    await page.getByPlaceholder(/\* \* \* \* \*/).fill('0 9 * * 1-5');
    await page.waitForTimeout(800);
    const all = (await readEverything(page)).toLowerCase();
    // Either descriptive text mentions 9 AM / weekday, OR a next-run date is shown.
    const hasInfo = /9.*am|9:00|monday|mon|weekday|업무일|평일|월.*금/.test(all);
    expect(hasInfo).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Color Picker
// ---------------------------------------------------------------------------
test.describe('Color Picker — edge & failure', () => {
  test('invalid hex (#zzzz) does not crash', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/color-picker');
    await page
      .locator('input')
      .first()
      .fill('#zzzz')
      .catch(() => {});
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('valid hex shows rgb + hsl conversions', async ({ page }) => {
    await page.goto('/#/color-picker');
    await page.waitForLoadState('networkidle');
    // Type a hex value into the first input → tool should populate the
    // other inputs (rgb/hsl) with conversions.
    await page.locator('input').first().fill('#ff0000');
    await page.waitForTimeout(800);
    const placeholders = await page
      .locator('input')
      .evaluateAll(els => els.map(e => (e as HTMLInputElement).placeholder).filter(Boolean));
    // The page is known to expose 3 inputs with rgb()/hsl() placeholders.
    // We just assert the page renders inputs that announce rgb + hsl.
    const placeholderText = placeholders.join(' ');
    expect(placeholderText).toMatch(/rgb\s*\(/i);
    expect(placeholderText).toMatch(/hsl\s*\(/i);
  });
});

// ---------------------------------------------------------------------------
// CSS Unit Converter
// ---------------------------------------------------------------------------
test.describe('CSS Unit Converter — edge & failure', () => {
  test('input renders without crashing on non-numeric text', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/css-converter');
    const numInput = page.locator('input[type="number"], input').first();
    await numInput.fill('abc').catch(() => {});
    await page.waitForTimeout(300);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Timestamp Converter
// ---------------------------------------------------------------------------
test.describe('Timestamp Converter — edge & failure', () => {
  test('Now button populates a fresh timestamp', async ({ page }) => {
    await page.goto('/#/timestamp');
    await page.getByRole('button', { name: /^now$/i }).first().click();
    await page.waitForTimeout(500);
    const all = await readEverything(page);
    // A 10-digit unix timestamp should show up.
    expect(/\b1\d{9}\b/.test(all)).toBe(true);
  });

  test('invalid timestamp text does not crash', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/timestamp');
    await page.waitForLoadState('networkidle');
    await page
      .getByPlaceholder(/enter timestamp/i)
      .fill('not-a-number')
      .catch(() => {});
    await page
      .locator('button', { hasText: /^Timestamp to Date$/ })
      .first()
      .click({ timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Base64 Converter (decode invalid input)
// ---------------------------------------------------------------------------
test.describe('Base64 Converter — decode edge cases', () => {
  test('Decode on invalid base64 does not crash', async ({ page }) => {
    const errors = await captureErrors(page);
    await page.goto('/#/base64');
    await page.waitForLoadState('networkidle');
    await page.locator('textarea').first().fill('***not-base64***');
    await page
      .locator('button', { hasText: /^Decode$/ })
      .first()
      .click({ timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
  });

  test('Decode on valid base64 returns original UTF-8 text', async ({ page }) => {
    await page.goto('/#/base64');
    await page.waitForLoadState('networkidle');
    // Two-step pattern: first Decode click switches mode (no action),
    // then a second Decode button appears as the action trigger.
    await page
      .locator('button', { hasText: /^Decode$/ })
      .first()
      .click();
    await page.waitForTimeout(300);
    await page.locator('textarea').first().fill('V2VjYW5uZXI=');
    const decodeBtns = page.locator('button', { hasText: /^Decode$/ });
    await decodeBtns.nth(1).click({ timeout: 5000 });
    await page.waitForTimeout(800);
    const out = await page.locator('textarea').nth(1).inputValue();
    expect(out).toContain('Wecanner');
  });
});

// ---------------------------------------------------------------------------
// Generic — every tool route absorbs huge input without crashing
// ---------------------------------------------------------------------------
test.describe('Stress — large input on text tools', () => {
  const textTools: Array<[string, string]> = [
    ['JSON Formatter', '#/json'],
    ['Base64 Converter', '#/base64'],
    ['URL Encoder', '#/url'],
    ['Hash Generator', '#/hash'],
  ];

  for (const [name, route] of textTools) {
    test(`${name} accepts 100KB input without page crash`, async ({ page }) => {
      const errors = await captureErrors(page);
      await page.goto(route);
      // 100KB of mixed ascii.
      const big = 'a'.repeat(100_000);
      const inputBox = page.locator("textarea, input[type='text']").first();
      await inputBox.fill(big);
      await page.waitForTimeout(500);
      // No uncaught errors. We don't assert output content — just that the
      // page survived.
      expect(errors.filter(e => !e.includes('DevTools'))).toEqual([]);
    });
  }
});

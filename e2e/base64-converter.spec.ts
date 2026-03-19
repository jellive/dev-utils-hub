import { test, expect } from '@playwright/test';

test.describe('Base64 Converter E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("Base64 Converter")');
    await page.waitForSelector('h2:has-text("Base64")', { timeout: 10000 });
  });

  test('displays encode and decode tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /encode/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /decode/i })).toBeVisible();
  });

  test('encodes plain text to base64', async ({ page }) => {
    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('textbox').first().fill('hello');
    await page.getByRole('button', { name: /encode/i }).click();

    const output = page.getByRole('textbox').nth(1);
    await expect(output).toHaveValue('aGVsbG8=');
  });

  test('decodes base64 to plain text', async ({ page }) => {
    await page.getByRole('tab', { name: /decode/i }).click();
    await page.getByRole('textbox').first().fill('aGVsbG8=');
    await page.getByRole('button', { name: /decode/i }).click();

    await expect(page.getByRole('textbox').nth(1)).toHaveValue('hello');
  });

  test('encode → decode round-trip', async ({ page }) => {
    const original = 'Dev Utils Hub 2024';

    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('textbox').first().fill(original);
    await page.getByRole('button', { name: /encode/i }).click();

    const encoded = await page.getByRole('textbox').nth(1).inputValue();
    expect(encoded).toBeTruthy();

    await page.getByRole('tab', { name: /decode/i }).click();
    await page.getByRole('textbox').first().fill(encoded);
    await page.getByRole('button', { name: /decode/i }).click();

    await expect(page.getByRole('textbox').nth(1)).toHaveValue(original);
  });

  test('shows error for invalid base64 input', async ({ page }) => {
    await page.getByRole('tab', { name: /decode/i }).click();
    await page.getByRole('textbox').first().fill('!!!not_base64!!!');
    await page.getByRole('button', { name: /decode/i }).click();

    await expect(page.locator('text=/invalid/i')).toBeVisible();
  });

  test('URL-safe mode produces no + / = characters', async ({ page }) => {
    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('switch', { name: /url.safe/i }).click();
    // 'Man' encodes to 'TWFu' without padding — use a string that normally produces + or /
    await page.getByRole('textbox').first().fill('subjects?_d=1');
    await page.getByRole('button', { name: /encode/i }).click();

    const output = await page.getByRole('textbox').nth(1).inputValue();
    expect(output).not.toMatch(/[+/=]/);
  });

  test('displays character and size counts', async ({ page }) => {
    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('textbox').first().fill('hello world');

    await expect(page.locator('text=/11.*char/i')).toBeVisible();
    await expect(page.locator('text=/bytes/i')).toBeVisible();
  });
});

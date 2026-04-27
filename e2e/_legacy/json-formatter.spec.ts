import { test, expect } from '@playwright/test';

test.describe('JSON Formatter E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("JSON Formatter")');
    await page.waitForSelector('h2:has-text("JSON Formatter")', { timeout: 10000 });
  });

  test('displays all UI elements', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('JSON Formatter');
    await expect(page.getByRole('button', { name: /format/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /compress/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();
  });

  test('formats valid JSON with 2-space indent', async ({ page }) => {
    await page.getByRole('textbox', { name: /json input/i }).fill('{"name":"Jell","active":true}');
    await page.getByRole('button', { name: /format/i }).click();

    const output = page.getByRole('textbox', { name: /formatted output/i });
    await expect(output).toContainText('"name": "Jell"');
    await expect(output).toContainText('"active": true');
  });

  test('shows error badge for invalid JSON', async ({ page }) => {
    await page.getByRole('textbox', { name: /json input/i }).fill('{ bad json }');
    await page.getByRole('button', { name: /format/i }).click();

    await expect(page.locator('text=/invalid json/i')).toBeVisible();
  });

  test('compresses JSON to single line', async ({ page }) => {
    await page.getByRole('textbox', { name: /json input/i }).fill('{\n  "a": 1,\n  "b": 2\n}');
    await page.getByRole('button', { name: /compress/i }).click();

    const output = page.getByRole('textbox', { name: /formatted output/i });
    const value = await output.inputValue();
    expect(value).toBe('{"a":1,"b":2}');
  });

  test('clears input and output', async ({ page }) => {
    await page.getByRole('textbox', { name: /json input/i }).fill('{"test":1}');
    await page.getByRole('button', { name: /format/i }).click();
    await page.getByRole('button', { name: /clear/i }).click();

    await expect(page.getByRole('textbox', { name: /json input/i })).toHaveValue('');
  });

  test('copies formatted output to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.getByRole('textbox', { name: /json input/i }).fill('{"x":1}');
    await page.getByRole('button', { name: /format/i }).click();
    await page.getByRole('button', { name: /copy/i }).click();

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(JSON.parse(clip)).toEqual({ x: 1 });
  });

  test('changes indent level to 4 spaces', async ({ page }) => {
    await page.getByRole('textbox', { name: /json input/i }).fill('{"a":1}');
    // Select 4-space indent
    await page.getByRole('combobox', { name: /indent/i }).selectOption('4');
    await page.getByRole('button', { name: /format/i }).click();

    const output = await page.getByRole('textbox', { name: /formatted output/i }).inputValue();
    expect(output).toContain('    "a"');
  });
});

import { test, expect } from '@playwright/test';

test.describe('URL Converter E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("URL Converter")');
    await page.waitForSelector('h2:has-text("URL")', { timeout: 10000 });
  });

  test('encodes URL with spaces and special characters', async ({ page }) => {
    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('textbox').first().fill('https://example.com/search?q=hello world');
    await page.getByRole('button', { name: /encode/i }).click();

    const output = await page.getByRole('textbox').nth(1).inputValue();
    expect(output).toContain('%20');
    expect(output).not.toContain(' ');
  });

  test('decodes percent-encoded URL', async ({ page }) => {
    await page.getByRole('tab', { name: /decode/i }).click();
    await page.getByRole('textbox').first().fill('https://example.com/search?q=hello%20world');
    await page.getByRole('button', { name: /decode/i }).click();

    await expect(page.getByRole('textbox').nth(1)).toHaveValue(
      'https://example.com/search?q=hello world'
    );
  });

  test('parses URL into components', async ({ page }) => {
    await page.getByRole('tab', { name: /parse/i }).click();
    await page.getByRole('textbox').first().fill('https://api.example.com:8080/v1/users?page=2#top');
    await page.getByRole('button', { name: /parse/i }).click();

    await expect(page.locator('text=api.example.com')).toBeVisible();
    await expect(page.locator('text=8080')).toBeVisible();
    await expect(page.locator('text=/v1/users')).toBeVisible();
  });

  test('shows error for empty input', async ({ page }) => {
    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('button', { name: /encode/i }).click();

    await expect(page.locator('text=/empty/i')).toBeVisible();
  });

  test('clears input and output', async ({ page }) => {
    await page.getByRole('tab', { name: /encode/i }).click();
    await page.getByRole('textbox').first().fill('https://example.com');
    await page.getByRole('button', { name: /encode/i }).click();
    await page.getByRole('button', { name: /clear/i }).click();

    await expect(page.getByRole('textbox').first()).toHaveValue('');
  });
});

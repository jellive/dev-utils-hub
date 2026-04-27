/**
 * Visual regression tests using Playwright screenshot comparison.
 * Screenshots are stored in e2e/snapshots/ and compared on each run.
 * On first run, golden snapshots are created automatically.
 */
import { test, expect } from '@playwright/test';

// Use only chromium for visual regression to avoid cross-browser font differences
test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Visual Regression — tool UIs', () => {
  test('home page tool grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await expect(page).toHaveScreenshot('home-tool-grid.png', { maxDiffPixelRatio: 0.02 });
  });

  test('JSON Formatter — empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("JSON Formatter")');
    await page.waitForSelector('h2:has-text("JSON Formatter")', { timeout: 10000 });
    await expect(page).toHaveScreenshot('json-formatter-empty.png', { maxDiffPixelRatio: 0.02 });
  });

  test('JSON Formatter — with formatted output', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("JSON Formatter")');
    await page.waitForSelector('h2:has-text("JSON Formatter")', { timeout: 10000 });
    await page.getByRole('textbox', { name: /json input/i }).fill('{"name":"Jell","tools":["json","base64"],"active":true}');
    await page.getByRole('button', { name: /format/i }).click();
    await expect(page).toHaveScreenshot('json-formatter-formatted.png', { maxDiffPixelRatio: 0.02 });
  });

  test('Base64 Converter — encode tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("Base64 Converter")');
    await page.waitForSelector('h2:has-text("Base64")', { timeout: 10000 });
    await page.getByRole('tab', { name: /encode/i }).click();
    await expect(page).toHaveScreenshot('base64-encode-tab.png', { maxDiffPixelRatio: 0.02 });
  });

  test('Base64 Converter — decode tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("Base64 Converter")');
    await page.waitForSelector('h2:has-text("Base64")', { timeout: 10000 });
    await page.getByRole('tab', { name: /decode/i }).click();
    await expect(page).toHaveScreenshot('base64-decode-tab.png', { maxDiffPixelRatio: 0.02 });
  });

  test('Hash Generator — empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("Hash Generator")');
    await page.waitForSelector('h2:has-text("Hash Generator")', { timeout: 10000 });
    await expect(page).toHaveScreenshot('hash-generator-empty.png', { maxDiffPixelRatio: 0.02 });
  });

  test('Hash Generator — with SHA-256 result', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("Hash Generator")');
    await page.waitForSelector('h2:has-text("Hash Generator")', { timeout: 10000 });
    await page.selectOption('select#hash-algorithm', 'sha256');
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'hello');
    await page.click('button:has-text("Generate Hash")');
    await expect(page).toHaveScreenshot('hash-generator-sha256.png', { maxDiffPixelRatio: 0.02 });
  });

  test('URL Converter — empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("URL Converter")');
    await page.waitForSelector('h2:has-text("URL")', { timeout: 10000 });
    await expect(page).toHaveScreenshot('url-converter-empty.png', { maxDiffPixelRatio: 0.02 });
  });

  test('URL Converter — parse result', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('role=grid[name="Tool Selection Grid"]');
    await page.click('button:has-text("URL Converter")');
    await page.waitForSelector('h2:has-text("URL")', { timeout: 10000 });
    await page.getByRole('tab', { name: /parse/i }).click();
    await page.getByRole('textbox').first().fill('https://api.example.com:8080/v1/data?page=1#top');
    await page.getByRole('button', { name: /parse/i }).click();
    await expect(page).toHaveScreenshot('url-converter-parsed.png', { maxDiffPixelRatio: 0.02 });
  });
});

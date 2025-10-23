import { test, expect } from '@playwright/test';

test.describe('Hash Generator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Hash tab
    await page.click('text=Hash');
    await page.waitForSelector('h2:has-text("Hash Generator")');
  });

  test('should display Hash Generator UI elements', async ({ page }) => {
    // Check title
    await expect(page.locator('h2')).toContainText('Hash Generator');

    // Check algorithm selector
    await expect(page.locator('select#hash-algorithm')).toBeVisible();

    // Check input textarea
    await expect(page.locator('textarea[placeholder*="Enter text to hash"]')).toBeVisible();

    // Check buttons
    await expect(page.locator('button:has-text("Generate Hash")')).toBeVisible();
    await expect(page.locator('button:has-text("Clear")')).toBeVisible();
  });

  test('should generate MD5 hash correctly', async ({ page }) => {
    // Select MD5 algorithm
    await page.selectOption('select#hash-algorithm', 'md5');

    // Enter text
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'hello');

    // Click Generate Hash
    await page.click('button:has-text("Generate Hash")');

    // Verify hash result
    const hashOutput = await page.locator('[data-testid="hash-output"]').textContent();
    expect(hashOutput).toBe('5d41402abc4b2a76b9719d911017c592');

    // Verify Copy button appears
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();
  });

  test('should generate SHA-256 hash correctly', async ({ page }) => {
    // Select SHA-256 algorithm
    await page.selectOption('select#hash-algorithm', 'sha256');

    // Enter text
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'hello');

    // Click Generate Hash
    await page.click('button:has-text("Generate Hash")');

    // Verify hash result (64 characters)
    const hashOutput = await page.locator('[data-testid="hash-output"]').textContent();
    expect(hashOutput).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  test('should generate SHA-512 hash correctly', async ({ page }) => {
    // Select SHA-512 algorithm
    await page.selectOption('select#hash-algorithm', 'sha512');

    // Enter text
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'hello');

    // Click Generate Hash
    await page.click('button:has-text("Generate Hash")');

    // Verify hash result (128 characters)
    const hashOutput = await page.locator('[data-testid="hash-output"]').textContent();
    expect(hashOutput).toHaveLength(128);
    expect(hashOutput).toMatch(/^[a-f0-9]{128}$/);
  });

  test('should show error for empty input', async ({ page }) => {
    // Click Generate Hash without entering text
    await page.click('button:has-text("Generate Hash")');

    // Verify error message
    await expect(page.locator('text=Input is empty')).toBeVisible();
  });

  test('should clear all inputs and results', async ({ page }) => {
    // Enter text and generate hash
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'test');
    await page.click('button:has-text("Generate Hash")');

    // Verify hash is displayed
    await expect(page.locator('[data-testid="hash-output"]')).toBeVisible();

    // Click Clear
    await page.click('button:has-text("Clear")');

    // Verify everything is cleared
    const textareaValue = await page.locator('textarea[placeholder*="Enter text to hash"]').inputValue();
    expect(textareaValue).toBe('');

    // Verify hash output is hidden
    await expect(page.locator('[data-testid="hash-output"]')).not.toBeVisible();

    // Verify algorithm is reset to MD5
    const selectedAlgorithm = await page.locator('select#hash-algorithm').inputValue();
    expect(selectedAlgorithm).toBe('md5');
  });

  test('should copy hash to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Generate hash
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'hello');
    await page.click('button:has-text("Generate Hash")');

    // Click Copy button
    await page.click('button:has-text("Copy")');

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  test('should switch between algorithms and maintain input', async ({ page }) => {
    // Enter text
    await page.fill('textarea[placeholder*="Enter text to hash"]', 'test');

    // Generate MD5
    await page.selectOption('select#hash-algorithm', 'md5');
    await page.click('button:has-text("Generate Hash")');
    const md5Hash = await page.locator('[data-testid="hash-output"]').textContent();

    // Switch to SHA-256
    await page.selectOption('select#hash-algorithm', 'sha256');
    await page.click('button:has-text("Generate Hash")');
    const sha256Hash = await page.locator('[data-testid="hash-output"]').textContent();

    // Verify hashes are different
    expect(md5Hash).not.toBe(sha256Hash);
    expect(md5Hash).toHaveLength(32);
    expect(sha256Hash).toHaveLength(64);
  });

  test('should handle Korean text correctly', async ({ page }) => {
    // Enter Korean text
    await page.fill('textarea[placeholder*="Enter text to hash"]', '안녕하세요');

    // Generate hash
    await page.click('button:has-text("Generate Hash")');

    // Verify hash is generated (32 characters for MD5)
    const hashOutput = await page.locator('[data-testid="hash-output"]').textContent();
    expect(hashOutput).toMatch(/^[a-f0-9]{32}$/);
  });

  test('should handle special characters correctly', async ({ page }) => {
    // Enter special characters
    await page.fill('textarea[placeholder*="Enter text to hash"]', '!@#$%^&*()');

    // Generate hash
    await page.click('button:has-text("Generate Hash")');

    // Verify hash is generated
    const hashOutput = await page.locator('[data-testid="hash-output"]').textContent();
    expect(hashOutput).toMatch(/^[a-f0-9]{32}$/);
  });
});

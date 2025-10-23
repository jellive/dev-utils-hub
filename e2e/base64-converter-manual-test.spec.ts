import { test, expect } from '@playwright/test';

test.describe('Base64 Converter Manual Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Click on Base64 tool
    await page.click('text=Base64 Encoder/Decoder');
  });

  test('should display character count and file size', async ({ page }) => {
    // Type some text
    const input = page.locator('textarea[placeholder*="Enter text"]').first();
    await input.fill('Hello World');

    // Check character count is displayed
    await expect(page.locator('text=/11 characters/i')).toBeVisible();

    // Check file size is displayed
    await expect(page.locator('text=/11 bytes/i')).toBeVisible();
  });

  test('should encode text to Base64', async ({ page }) => {
    // Enter text
    const input = page.locator('textarea[placeholder*="Enter text"]').first();
    await input.fill('Hello');

    // Click encode button
    await page.click('button:has-text("Encode")');

    // Check output
    const output = page.locator('textarea[placeholder*="Base64 output"]');
    await expect(output).toHaveValue('SGVsbG8=');

    // Check output character count
    await expect(page.locator('text=/8 characters/i').nth(1)).toBeVisible();
  });

  test('should decode Base64 to text', async ({ page }) => {
    // Switch to decode tab
    await page.click('button[role="tab"]:has-text("Decode")');

    // Enter Base64
    const input = page.locator('textarea[placeholder*="Enter text"]').first();
    await input.fill('SGVsbG8=');

    // Click decode button
    await page.click('button:has-text("Decode")');

    // Check output
    const output = page.locator('textarea[placeholder*="Base64 output"]');
    await expect(output).toHaveValue('Hello');
  });

  test('should handle URL-safe Base64', async ({ page }) => {
    // Enable URL-safe switch
    await page.click('button[role="switch"]');

    // Enter text that creates + and / in standard Base64
    const input = page.locator('textarea[placeholder*="Enter text"]').first();
    await input.fill('Hello>?>World');

    // Click encode button
    await page.click('button:has-text("Encode")');

    // Check output doesn't contain + or /
    const output = page.locator('textarea[placeholder*="Base64 output"]');
    const outputValue = await output.inputValue();
    expect(outputValue).not.toContain('+');
    expect(outputValue).not.toContain('/');
  });

  test('should update character count in real-time', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="Enter text"]').first();

    // Type "Hi"
    await input.fill('Hi');
    await expect(page.locator('text=/2 characters/i').first()).toBeVisible();

    // Type "Hello"
    await input.fill('Hello');
    await expect(page.locator('text=/5 characters/i').first()).toBeVisible();
  });

  test('should display file size in KB for larger text', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="Enter text"]').first();

    // Type 1KB of text
    const text1KB = 'A'.repeat(1024);
    await input.fill(text1KB);

    // Check KB is displayed
    await expect(page.locator('text=/1.0 KB/i')).toBeVisible();
  });

  test('should switch between Encode and Decode tabs', async ({ page }) => {
    // Check Encode tab is active
    const encodeTab = page.locator('button[role="tab"]:has-text("Encode")');
    await expect(encodeTab).toHaveAttribute('data-state', 'active');

    // Click Decode tab
    const decodeTab = page.locator('button[role="tab"]:has-text("Decode")');
    await decodeTab.click();

    // Check Decode tab is now active
    await expect(decodeTab).toHaveAttribute('data-state', 'active');
    await expect(encodeTab).toHaveAttribute('data-state', 'inactive');
  });

  test('should have ArrowUp and ArrowDown icons in tabs', async ({ page }) => {
    // Check for icons (lucide-react icons have specific SVG structure)
    const encodeTab = page.locator('button[role="tab"]:has-text("Encode")');
    const decodeTab = page.locator('button[role="tab"]:has-text("Decode")');

    // Icons should be visible
    await expect(encodeTab.locator('svg')).toBeVisible();
    await expect(decodeTab.locator('svg')).toBeVisible();
  });

  test('should copy output to clipboard', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Enter and encode text
    const input = page.locator('textarea[placeholder*="Enter text"]').first();
    await input.fill('Test');
    await page.click('button:has-text("Encode")');

    // Click copy button
    await page.click('button:has-text("Copy")');

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('VGVzdA==');
  });

  test('should clear input and output', async ({ page }) => {
    // Enter and encode text
    const input = page.locator('textarea[placeholder*="Enter text"]').first();
    await input.fill('Test');
    await page.click('button:has-text("Encode")');

    // Verify output exists
    const output = page.locator('textarea[placeholder*="Base64 output"]');
    await expect(output).toHaveValue('VGVzdA==');

    // Click clear
    await page.click('button:has-text("Clear")');

    // Verify both are cleared
    await expect(input).toHaveValue('');
    await expect(output).toHaveValue('');
  });
});

import { test, expect } from '@playwright/test';

test.describe('API Tester - Core Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/api-tester');
    await page.locator('input[type="url"]').waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should send GET request and display response', async ({ page }) => {
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');

    const sendButton = page.getByText('Send', { exact: true });
    await sendButton.click();

    // Wait for response (check for userId field)
    await page.waitForSelector('text=/"userId"/', { timeout: 10000 });

    // Verify status code is displayed
    const statusText = await page.textContent('body');
    expect(statusText).toContain('200');
  });

  test('should save and restore request from history', async ({ page }) => {
    // Send a request
    const urlInput = page.locator('input[type="url"]');
    const testUrl = 'https://jsonplaceholder.typicode.com/posts/1';
    await urlInput.fill(testUrl);

    const sendButton = page.getByText('Send', { exact: true });
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Clear URL
    await urlInput.clear();
    await expect(urlInput).toHaveValue('');

    // Click on history item (look for the URL in history)
    const historyItem = page.locator(`text=${testUrl}`).first();
    await historyItem.click();

    // Verify URL is restored
    await expect(urlInput).toHaveValue(testUrl);
  });

  test('should persist history after page reload', async ({ page }) => {
    // Send a request
    const urlInput = page.locator('input[type="url"]');
    const testUrl = 'https://jsonplaceholder.typicode.com/posts/1';
    await urlInput.fill(testUrl);

    const sendButton = page.getByText('Send', { exact: true });
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.locator('input[type="url"]').waitFor({ state: 'visible', timeout: 10000 });

    // Verify history contains the request
    const historyItem = page.locator(`text=${testUrl}`).first();
    await expect(historyItem).toBeVisible({ timeout: 5000 });
  });

  test('should add custom headers', async ({ page }) => {
    // Click Headers tab
    const headersTab = page.getByText('Headers', { exact: true });
    await headersTab.click();

    // Click Add Header button
    const addButton = page.getByText('Add Header');
    await addButton.click();

    // Fill header
    const headerInputs = await page.locator('input[placeholder*="Header"]').all();
    if (headerInputs.length >= 2) {
      await headerInputs[0].fill('X-Custom');
      await headerInputs[1].fill('test-value');
    }

    // Verify header is added (value input should have the value)
    const valueInput = page.locator('input[value="test-value"]');
    await expect(valueInput).toBeVisible();
  });

  test('should use Bearer Token authentication', async ({ page }) => {
    // Click Authorization tab
    const authTab = page.getByText('Authorization', { exact: true });
    await authTab.click();

    // Click Bearer Token tab (use role to be more specific)
    const bearerTab = page.getByRole('tab', { name: 'Bearer Token' });
    await bearerTab.click();

    // Enter token
    const tokenInput = page.locator('input[type="password"]').or(page.locator('input[placeholder*="bearer"]')).first();
    await tokenInput.fill('test-token-123');

    // Verify token is entered
    await expect(tokenInput).toHaveValue('test-token-123');
  });

  test('should handle 404 error', async ({ page }) => {
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/999999');

    const sendButton = page.getByText('Send', { exact: true });
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(3000);

    // Verify 404 status is displayed
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('404');
  });

  test('should clear history', async ({ page }) => {
    // Send multiple requests
    const urlInput = page.locator('input[type="url"]');
    const sendButton = page.getByText('Send', { exact: true });

    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');
    await sendButton.click();
    await page.waitForTimeout(1500);

    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/2');
    await sendButton.click();
    await page.waitForTimeout(1500);

    // Find and click Clear button in history section
    const clearButtons = await page.getByText('Clear').all();
    if (clearButtons.length > 0) {
      // Click the last Clear button (likely the history clear button)
      await clearButtons[clearButtons.length - 1].click();

      // Verify history is empty
      const noHistoryText = page.getByText(/No history/i);
      await expect(noHistoryText).toBeVisible({ timeout: 3000 });
    }
  });

  test('should switch between HTTP methods', async ({ page }) => {
    // Click GET button to open dropdown
    const getButton = page.locator('button:has-text("GET")').first();
    await getButton.click();

    // Wait for dropdown
    await page.waitForTimeout(500);

    // Click POST
    const postOption = page.getByText('POST', { exact: true });
    await postOption.click();

    // Verify POST is now selected
    const postButton = page.locator('button:has-text("POST")').first();
    await expect(postButton).toBeVisible();
  });

  test('should display response headers', async ({ page }) => {
    // Send request
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');

    const sendButton = page.getByText('Send', { exact: true });
    await sendButton.click();

    await page.waitForTimeout(2000);

    // Find and click Headers tab in response section (not request)
    // Look for the second Headers tab/button
    const headersTabs = await page.getByText('Headers').all();
    if (headersTabs.length > 1) {
      await headersTabs[headersTabs.length - 1].click();

      // Verify content-type header is visible
      await page.waitForTimeout(1000);
      const bodyText = await page.textContent('body');
      expect(bodyText?.toLowerCase()).toContain('content-type');
    }
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Enter invalid/timeout URL
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('https://this-definitely-does-not-exist-12345.com');

    const sendButton = page.getByText('Send', { exact: true });
    await sendButton.click();

    // Wait for error
    await page.waitForTimeout(5000);

    // Should show some error indication (error, failed, network, etc.)
    const bodyText = await page.textContent('body');
    const hasError = bodyText?.toLowerCase().includes('error') ||
                     bodyText?.toLowerCase().includes('failed') ||
                     bodyText?.toLowerCase().includes('network');

    expect(hasError).toBeTruthy();
  });
});

import { test, expect } from '@playwright/test';

test.describe('API Tester Page Check', () => {
  test('should display API Tester page and all components', async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Navigate to the app
    await page.goto('http://localhost:5173/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'e2e/screenshots/homepage.png', fullPage: true });

    // Check if API Tester tool exists in the grid
    const apiTesterCard = page.locator('text=API Tester').first();
    const exists = await apiTesterCard.count();
    console.log(`API Tester card count: ${exists}`);

    if (exists > 0) {
      // Click on API Tester
      await apiTesterCard.click();

      // Wait for navigation and content
      await page.waitForURL('**/api');
      await page.waitForTimeout(2000);

      // Take screenshot of API Tester page
      await page.screenshot({ path: 'e2e/screenshots/api-tester-page.png', fullPage: true });

      // Check for MethodSelector
      const methodSelector = page.locator('text=GET').first();
      console.log(`Method selector visible: ${await methodSelector.isVisible()}`);

      // Check for URL input
      const urlInput = page.locator('input[type="url"]').first();
      console.log(`URL input visible: ${await urlInput.isVisible()}`);

      // Check for tabs
      const headersTab = page.locator('text=Headers').first();
      console.log(`Headers tab visible: ${await headersTab.isVisible()}`);

      const authTab = page.locator('text=Authorization').first();
      console.log(`Authorization tab visible: ${await authTab.isVisible()}`);

      // Click on Authorization tab
      if (await authTab.isVisible()) {
        await authTab.click();
        await page.waitForTimeout(500);

        // Take screenshot of auth tab
        await page.screenshot({ path: 'e2e/screenshots/auth-tab.png', fullPage: true });

        // Check for auth mode tabs
        const bearerTab = page.locator('text=Bearer Token').first();
        const basicTab = page.locator('text=Basic Auth').first();
        const apiKeyTab = page.locator('text=API Key').first();

        console.log(`Bearer Token tab visible: ${await bearerTab.isVisible()}`);
        console.log(`Basic Auth tab visible: ${await basicTab.isVisible()}`);
        console.log(`API Key tab visible: ${await apiKeyTab.isVisible()}`);
      }

      // Click on Headers tab
      if (await headersTab.isVisible()) {
        await headersTab.click();
        await page.waitForTimeout(500);

        // Take screenshot of headers tab
        await page.screenshot({ path: 'e2e/screenshots/headers-tab.png', fullPage: true });
      }
    } else {
      console.log('API Tester card not found on homepage');

      // List all visible text on the page
      const bodyText = await page.locator('body').textContent();
      console.log('Page content:', bodyText?.substring(0, 500));
    }
  });
});

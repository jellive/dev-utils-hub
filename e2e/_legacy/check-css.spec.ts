import { test, expect } from '@playwright/test';

test('Check if CSS is loaded', async ({ page }) => {
  // Listen to network requests
  const cssRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('.css')) {
      cssRequests.push(request.url());
    }
  });

  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  console.log('CSS requests:', cssRequests);

  // Check if any stylesheets are loaded
  const stylesheets = await page.evaluate(() => {
    return Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href,
      ruleCount: sheet.cssRules?.length || 0
    }));
  });

  console.log('Loaded stylesheets:', JSON.stringify(stylesheets, null, 2));

  // Check computed styles on a Card element
  const card = page.locator('button:has-text("JSON Formatter")').first();
  const styles = await card.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      borderRadius: computed.borderRadius,
      boxShadow: computed.boxShadow,
      backgroundColor: computed.backgroundColor,
      border: computed.border,
    };
  });

  console.log('Card computed styles:', JSON.stringify(styles, null, 2));
});

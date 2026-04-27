import { test } from '@playwright/test';

test('Debug current browser state', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('role=grid[name="Tool Selection Grid"]');

  // Card 요소의 실제 HTML 확인
  const cardHtml = await page.locator('button:has-text("JSON Formatter")').first().evaluate((el) => {
    const parent = el.closest('button');
    return parent?.outerHTML || 'not found';
  });

  console.log('\n=== Button HTML (first 800 chars) ===');
  console.log(cardHtml.substring(0, 800));

  // Card div의 클래스 확인
  const cardClasses = await page.locator('button:has-text("JSON Formatter") > div').first().evaluate((el) => {
    return {
      className: el.className,
      computedStyles: {
        borderRadius: window.getComputedStyle(el).borderRadius,
        border: window.getComputedStyle(el).border,
        backgroundColor: window.getComputedStyle(el).backgroundColor,
        boxShadow: window.getComputedStyle(el).boxShadow,
      }
    };
  });

  console.log('\n=== Card Component ===');
  console.log('Classes:', cardClasses.className);
  console.log('Computed Styles:', JSON.stringify(cardClasses.computedStyles, null, 2));

  // 스크린샷
  await page.screenshot({ path: '/tmp/browser-state.png', fullPage: true });
  console.log('\nScreenshot saved to /tmp/browser-state.png');
});

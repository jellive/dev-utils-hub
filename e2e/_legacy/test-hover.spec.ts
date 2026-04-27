import { test, expect } from '@playwright/test';

test('Check ToolGrid hover effects', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Wait for grid to load
  await page.waitForSelector('role=grid[name="Tool Selection Grid"]');

  // Get first card button
  const card = page.locator('button:has-text("JSON Formatter")').first();

  // Check if className contains hover classes
  const className = await card.getAttribute('class');
  console.log('Button className:', className);

  // Check if the classes are present
  const hasHoverTranslate = className?.includes('hover:-translate-y-2');
  const hasHoverShadow = className?.includes('hover:shadow-xl');
  const hasGroup = className?.includes('group');

  console.log('Has hover:-translate-y-2:', hasHoverTranslate);
  console.log('Has hover:shadow-xl:', hasHoverShadow);
  console.log('Has group class:', hasGroup);

  // Take screenshots before and during hover
  await page.screenshot({ path: '/tmp/hover-before.png', fullPage: true });

  await card.hover();
  await page.waitForTimeout(500);

  await page.screenshot({ path: '/tmp/hover-during.png', fullPage: true });

  console.log('Screenshots saved');

  // Check actual styles during hover
  const hoverStyles = await card.evaluate((el) => {
    return {
      className: el.className,
      transform: window.getComputedStyle(el).transform,
      transition: window.getComputedStyle(el).transition,
    };
  });

  console.log('Hover state:', hoverStyles);
});

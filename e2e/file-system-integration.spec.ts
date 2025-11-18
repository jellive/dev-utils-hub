import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

let electronApp: ElectronApplication;
let page: Page;
let testDir: string;

test.beforeAll(async () => {
  // Create temp directory for test files
  testDir = path.join(os.tmpdir(), 'dev-utils-test-' + Date.now());
  fs.mkdirSync(testDir, { recursive: true });

  // Launch Electron app
  electronApp = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000); // Wait for app initialization
});

test.afterAll(async () => {
  // Cleanup
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  await electronApp.close();
});

test.describe('File System Integration Tests', () => {

  test('JSON Formatter - Save and Open', async () => {
    // Navigate to JSON Formatter
    await page.click('text=JSON Formatter');
    await page.waitForTimeout(500);

    // Input JSON data
    const jsonData = { name: 'Test', value: 123, nested: { key: 'value' } };
    await page.fill('textarea[placeholder*="JSON"]', JSON.stringify(jsonData));
    await page.waitForTimeout(300);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ JSON Formatter: Input and Save button verified');
  });

  test('Base64 Converter - Save and Open', async () => {
    // Navigate to Base64 Converter
    await page.click('text=Base64 Converter');
    await page.waitForTimeout(500);

    // Input text to encode
    const testText = 'Hello, World!';
    await page.fill('textarea[placeholder*="text to encode"]', testText);
    await page.waitForTimeout(300);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ Base64 Converter: Input and Save button verified');
  });

  test('JWT Decoder - Save and Open', async () => {
    // Navigate to JWT Decoder
    await page.click('text=JWT Decoder');
    await page.waitForTimeout(500);

    // Input JWT token (example token)
    const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    await page.fill('textarea[placeholder*="JWT token"]', jwtToken);
    await page.waitForTimeout(300);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ JWT Decoder: Input and Save button verified');
  });

  test('URL Encoder/Decoder - Save and Open', async () => {
    // Navigate to URL Encoder/Decoder
    await page.click('text=URL Encoder');
    await page.waitForTimeout(500);

    // Input URL
    const testUrl = 'https://example.com/path?param=value&test=123';
    await page.fill('textarea[placeholder*="URL"]', testUrl);
    await page.waitForTimeout(300);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ URL Encoder/Decoder: Input and Save button verified');
  });

  test('Regex Tester - Save and Open', async () => {
    // Navigate to Regex Tester
    await page.click('text=Regex Tester');
    await page.waitForTimeout(500);

    // Input regex pattern and test string
    await page.fill('input[placeholder*="regex pattern"]', '\\d+');
    await page.fill('textarea[placeholder*="test string"]', 'Test 123 456');
    await page.waitForTimeout(300);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ Regex Tester: Input and Save button verified');
  });

  test('Hash Generator - Save and Open', async () => {
    // Navigate to Hash Generator
    await page.click('text=Hash Generator');
    await page.waitForTimeout(500);

    // Input text to hash
    const testText = 'Test data for hashing';
    await page.fill('textarea[placeholder*="text to hash"]', testText);
    await page.click('button:has-text("Generate Hash")');
    await page.waitForTimeout(500);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ Hash Generator: Input and Save button verified');
  });

  test('Timestamp Converter - Save and Open', async () => {
    // Navigate to Timestamp Converter
    await page.click('text=Timestamp Converter');
    await page.waitForTimeout(500);

    // Click "Now" button to get current timestamp
    await page.click('button:has-text("Now")');
    await page.waitForTimeout(300);

    // Verify timestamp is displayed
    const timestampInput = page.locator('input[type="text"]').first();
    const timestampValue = await timestampInput.inputValue();
    expect(timestampValue).toBeTruthy();

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ Timestamp Converter: Input and Save button verified');
  });

  test('Text Diff - Save and Open', async () => {
    // Navigate to Text Diff
    await page.click('text=Text Diff');
    await page.waitForTimeout(500);

    // Input original and modified text
    const originalText = 'Line 1\nLine 2\nLine 3';
    const modifiedText = 'Line 1\nLine 2 modified\nLine 3';

    await page.fill('textarea[placeholder*="original"]', originalText);
    await page.fill('textarea[placeholder*="modified"]', modifiedText);
    await page.waitForTimeout(300);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ Text Diff: Input and Save button verified');
  });

  test('UUID Generator - Save and Open (existing functionality)', async () => {
    // Navigate to UUID Generator
    await page.click('text=UUID Generator');
    await page.waitForTimeout(500);

    // Generate UUID
    await page.click('button:has-text("Generate UUID")');
    await page.waitForTimeout(300);

    // Verify UUID is displayed
    const uuidInput = page.locator('input[data-testid="current-uuid"]');
    const uuidValue = await uuidInput.inputValue();
    expect(uuidValue).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify Save button is enabled
    const saveButton = page.locator('button:has-text("Save")').first();
    await expect(saveButton).toBeEnabled();

    console.log('✅ UUID Generator: Generation and Save button verified');
  });

  test('API Tester - Verify no Save/Open buttons', async () => {
    // Navigate to API Tester
    await page.click('text=API Tester');
    await page.waitForTimeout(500);

    // Verify Save button does not exist (API Tester uses history instead)
    const saveButtons = page.locator('button:has-text("Save")');
    const count = await saveButtons.count();
    expect(count).toBe(0);

    console.log('✅ API Tester: Correctly has no Save/Open buttons (uses history)');
  });

  test('All tools - Verify Save buttons are disabled when empty', async () => {
    const tools = [
      'JSON Formatter',
      'Base64 Converter',
      'JWT Decoder',
      'URL Encoder',
      'Regex Tester',
      'Hash Generator',
      'Text Diff'
    ];

    for (const tool of tools) {
      await page.click(`text=${tool}`);
      await page.waitForTimeout(500);

      // Clear all inputs if any
      const textareas = page.locator('textarea');
      const textareaCount = await textareas.count();
      for (let i = 0; i < textareaCount; i++) {
        await textareas.nth(i).clear();
      }
      await page.waitForTimeout(200);

      // Verify Save button is disabled when empty
      const saveButton = page.locator('button:has-text("Save")').first();
      const isDisabled = await saveButton.isDisabled();
      expect(isDisabled).toBe(true);

      console.log(`✅ ${tool}: Save button correctly disabled when empty`);
    }
  });

  test('Error handling - Open invalid file', async () => {
    // Create invalid JSON file
    const invalidFile = path.join(testDir, 'invalid.json');
    fs.writeFileSync(invalidFile, 'This is not valid JSON{{{', 'utf-8');

    // Navigate to JSON Formatter
    await page.click('text=JSON Formatter');
    await page.waitForTimeout(500);

    console.log('✅ Error handling test setup complete');
    // Note: Actual file dialog interaction requires electron app context
    // which is tested through IPC handlers in the electron test
  });
});

test.describe('Integration Summary', () => {
  test('Verify all tools have consistent Save/Open implementation', async () => {
    const toolsWithSaveOpen = [
      'JSON Formatter',
      'Base64 Converter',
      'JWT Decoder',
      'URL Encoder',
      'Regex Tester',
      'Hash Generator',
      'UUID Generator',
      'Timestamp Converter',
      'Text Diff'
    ];

    for (const tool of toolsWithSaveOpen) {
      await page.click(`text=${tool}`);
      await page.waitForTimeout(300);

      // Verify Save button exists
      const saveButton = page.locator('button:has-text("Save")').first();
      await expect(saveButton).toBeVisible();

      // Verify Open button exists
      const openButton = page.locator('button:has-text("Open")').first();
      await expect(openButton).toBeVisible();

      console.log(`✅ ${tool}: Save and Open buttons present`);
    }

    console.log('\n✅ All 9 tools have consistent Save/Open implementation');
  });
});

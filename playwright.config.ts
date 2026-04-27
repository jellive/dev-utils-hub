import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // _legacy/ holds Electron-era specs and pre-Tauri-migration tests with
  // stale selectors. Keep them in-tree as a reference but don't run them.
  testIgnore: ['**/_legacy/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    // Use Vite-only dev server for E2E (Playwright runs Chromium, not Tauri WebView).
    // `npm run dev` is `tauri dev` which incurs a multi-minute Rust compile,
    // breaking the default 60s webServer timeout. Tauri-specific specs (file
    // system, dialogs) will be marked .skip when running outside Tauri.
    command: 'npm run dev:web -- --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

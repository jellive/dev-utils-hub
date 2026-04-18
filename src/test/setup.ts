import React from 'react';
import { afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';

// React must be available as a global for JSX in test files (react-jsx transform
// does not inject it automatically in the happy-dom environment)
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/locales/en.json';

// Add jest-axe matchers to vitest
expect.extend(toHaveNoViolations);

// Initialize i18n for tests
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock DOM classList methods
Object.defineProperty(document.documentElement, 'classList', {
  value: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
    toggle: vi.fn(),
  },
  writable: true,
});

// Mock window.api for Electron IPC (not available in test environment)
const mockHistoryApi = {
  save: vi.fn().mockResolvedValue(1),
  get: vi.fn().mockResolvedValue([]),
  search: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(true),
  toggleFavorite: vi.fn().mockResolvedValue(true),
  clear: vi.fn().mockResolvedValue(0),
  clearAll: vi.fn().mockResolvedValue(0),
  getById: vi.fn().mockResolvedValue(undefined),
  stats: vi.fn().mockResolvedValue({ total: 0, byTool: {} }),
  count: vi.fn().mockResolvedValue(0),
};

const mockFileApi = {
  save: vi.fn().mockResolvedValue({ success: true, filePath: '/mock/file.json' }),
  open: vi.fn().mockResolvedValue({ success: true, content: '' }),
};

Object.defineProperty(window, 'api', {
  value: {
    history: mockHistoryApi,
    file: mockFileApi,
  },
  writable: true,
  configurable: true,
});

// Mock @tauri-apps/api/core (transformCallback is used internally by @tauri-apps/api/event)
vi.mock('@tauri-apps/api/core', () => ({
  transformCallback: vi.fn((_cb: unknown) => Date.now()),
  invoke: vi.fn().mockResolvedValue(undefined),
  Channel: vi.fn(),
}));

// Mock @tauri-apps/api/event (listen/emit used by tauri-api.ts)
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async () => vi.fn()),
  emit: vi.fn().mockResolvedValue(undefined),
  once: vi.fn(async () => vi.fn()),
  TauriEvent: { WINDOW_RESIZED: 'tauri://resize' },
}));

// Mock @tauri-apps/plugin-clipboard-manager
vi.mock('@tauri-apps/plugin-clipboard-manager', () => ({
  readText: vi.fn().mockResolvedValue(''),
  writeText: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
}));

// Mock @tauri-apps/plugin-dialog
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn().mockResolvedValue(null),
  open: vi.fn().mockResolvedValue(null),
}));

// Mock @tauri-apps/plugin-fs
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn().mockResolvedValue(''),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

// Mock @/renderer/lib/tauri-api so hooks that check api?.history / api?.clipboard
// proxy through to window.api (set by individual tests), preserving the
// existing test contracts while also making api.shortcuts.listen work.
vi.mock('@/renderer/lib/tauri-api', async () => {
  const apiProxy = new Proxy(
    {},
    {
      get(_target, prop) {
        const windowApi = (window as any).api;
        if (windowApi && prop in windowApi) {
          return windowApi[prop as string];
        }
        // Expose top-level methods that forward to window.api if present
        return undefined;
      },
      has(_target, prop) {
        const windowApi = (window as any).api;
        return !!(windowApi && prop in windowApi);
      },
    }
  );
  return { api: apiProxy };
});

// Mock react-router-dom hooks for components that use navigation
// Tests that need real routing should wrap components in MemoryRouter
vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  };
});

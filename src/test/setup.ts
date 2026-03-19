import { afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
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

// Mock react-router-dom hooks for components that use navigation
// Tests that need real routing should wrap components in MemoryRouter
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
  };
});

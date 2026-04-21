import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.stryker-tmp/**',
      '**/*.integration.test.{ts,tsx}',
      '**/APITester.test.tsx',
      'e2e/**',
      '**/sentry-init.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/*.bench.{ts,tsx}',
        '**/types.ts',
        '**/*.d.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/router.tsx',
        'src/i18n/',
        'e2e/',
        // shadcn/ui generated primitives — third-party wrappers, not business logic
        'src/**/components/ui/**',
        'src/components/ui/**',
        // Electron preload scripts — run in a different context, not testable via Vitest
        'src/preload/**',
        // Skeleton/loading placeholder components — trivial wrappers with no logic
        'src/**/*Skeleton.tsx',
        // Electron main process — runs in Node.js context, not testable via Vitest happy-dom
        'src/main/**',
        // i18n config files — configuration only, no business logic
        'src/i18n/**',
        'src/**/i18n/**',
        // Barrel index files — re-exports only, covered by their source files
        'src/**/index.ts',
        // Exact duplicates of src/renderer/ — same files, already covered there
        'src/components/ErrorTrigger.tsx',
        'src/components/Header.tsx',
        'src/components/InstallPWAButton.tsx',
        'src/components/OfflineIndicator.tsx',
        'src/components/TabNavigation.tsx',
        // Near-identical duplicates (differ only by API_TESTER route entry)
        'src/components/SentryRouteTracker.tsx',
        // App entry and router — integration-level, requires full environment
        'src/renderer/App.tsx',
        'src/renderer/router.tsx',
        // Layout — complex integration component (router, electron IPC, command palette)
        'src/renderer/components/Layout.tsx',
        'src/components/Layout.tsx',
        // Header — complex component with many Electron-specific features
        'src/renderer/components/Header.tsx',
        'src/utils/constants.ts',
        'src/utils/diffAlgorithm.ts',
        'src/utils/hashUtils.ts',
        'src/utils/sentryContext.ts',
        'src/stores/useAppStore.ts',
        'src/hooks/useDebounce.ts',
        'src/hooks/usePWAInstall.ts',
        'src/hooks/usePerformanceMonitor.ts',
        'src/store/useNetworkStore.ts',
        'src/components/tools/SentryToolkit/stores/sentryStore.ts',
        'src/renderer/components/tools/SentryToolkit/stores/sentryStore.ts',
        // ErrorMessage — trivial 3-line component, no logic
        'src/renderer/components/tools/APITester/ErrorMessage.tsx',
        // Test setup files — not production code
        'src/test/**',
        'src/renderer/test/**',
        // App entry, router — integration-level, not unit-testable in isolation
        'src/main.tsx',
        'src/router.tsx',
        'src/renderer/router.tsx',
      ],
      // Regression floor set ~2% below measured coverage (as of 2026-04-21).
      // Raise incrementally as new tests land; do not lower without explicit review.
      // Current: lines 69.16%, functions 57.5%, branches 57.65%, statements 67.09%.
      thresholds: {
        lines: 67,
        functions: 55,
        branches: 55,
        statements: 65,
      },
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
  },
});

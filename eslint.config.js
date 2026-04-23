import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', '.stryker-tmp', 'coverage', 'dev-dist', 'src-tauri/target', 'e2e']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // Catch-handlers without an underscore prefix are common in
          // try/catch boundaries that just want to swallow the error and
          // surface a fallback UI; flagging every one of them was noise.
          caughtErrors: 'none',
        },
      ],
      // shadcn/ui-style files intentionally export both the component and a
      // sibling variants object; downgrade fast-refresh nag to warning so it
      // still shows up in CI output without failing the build.
      'react-refresh/only-export-components': 'warn',
    },
  },
  // Test files: relax rules that are intentionally violated in test infrastructure
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/test/**/*.{ts,tsx}',
      '**/*.d.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
]);

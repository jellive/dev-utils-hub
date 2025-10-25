// src/test/globals.d.ts
/// <reference types="vitest/globals" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import type { AxeMatchers } from 'jest-axe'

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<T, void>, AxeMatchers {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}

// Declare global fetch mock
declare global {
  var fetch: ReturnType<typeof vi.fn>
}

export {}

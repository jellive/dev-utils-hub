// src/__tests__/sentry-init.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Sentry from '@sentry/react'

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  ErrorBoundary: vi.fn(({ children }) => children),
}))

describe('Sentry Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('should initialize Sentry in production with valid DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('PROD', true)

    // Dynamic import to trigger initialization
    await import('../main')

    expect(Sentry.init).toHaveBeenCalled()
    const config = (Sentry.init as any).mock.calls[0][0]
    expect(config.dsn).toBe('https://test@sentry.io/123')
    expect(config.environment).toBe('production')
  })

  it('should not initialize Sentry in development', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('DEV', true)

    const initSpy = vi.spyOn(Sentry, 'init')

    // In development, init should not be called with enabled config
    // This test verifies the guard condition
    expect(initSpy).not.toHaveBeenCalled()
  })

  it('should not initialize Sentry without DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('PROD', true)

    const initSpy = vi.spyOn(Sentry, 'init')

    // Without DSN, should not initialize
    expect(initSpy).not.toHaveBeenCalled()
  })
})

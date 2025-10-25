// src/config/__tests__/sentry.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSentryConfig } from '../sentry'

describe('Sentry Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    vi.unstubAllEnvs()
  })

  describe('getSentryConfig', () => {
    it('should return valid Sentry configuration with DSN', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
      vi.stubEnv('MODE', 'production')

      const config = getSentryConfig()

      expect(config).toBeDefined()
      expect(config.dsn).toBe('https://test@sentry.io/123')
      expect(config.environment).toBe('production')
    })

    it('should have enabled true in production mode', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
      vi.stubEnv('MODE', 'production')
      vi.stubEnv('PROD', true)

      const config = getSentryConfig()

      expect(config.enabled).toBe(true)
    })

    it('should have enabled false in development mode', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
      vi.stubEnv('MODE', 'development')
      vi.stubEnv('DEV', true)

      const config = getSentryConfig()

      expect(config.enabled).toBe(false)
    })

    it('should include tracesSampleRate', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()

      expect(config.tracesSampleRate).toBeDefined()
      expect(config.tracesSampleRate).toBeGreaterThan(0)
      expect(config.tracesSampleRate).toBeLessThanOrEqual(1)
    })

    it('should include release version format', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()

      expect(config.release).toBeDefined()
      expect(config.release).toContain('dev-utils-hub@')
    })

    it('should handle missing DSN gracefully', () => {
      vi.stubEnv('VITE_SENTRY_DSN', '')

      const config = getSentryConfig()

      expect(config.dsn).toBe('')
      expect(config.enabled).toBe(false)
    })

    it('should include environment from MODE', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
      vi.stubEnv('MODE', 'staging')

      const config = getSentryConfig()

      expect(config.environment).toBe('staging')
    })

    it('should have beforeSend hook', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()

      expect(config.beforeSend).toBeDefined()
      expect(typeof config.beforeSend).toBe('function')
    })
  })
})

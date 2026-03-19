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

    it('should have enabled true in development mode when DSN is provided', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')
      vi.stubEnv('MODE', 'development')
      vi.stubEnv('DEV', true)

      const config = getSentryConfig()

      // enabled is based on DSN presence, not environment
      expect(config.enabled).toBe(true)
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

  describe('beforeSend data filtering', () => {
    it('should filter sensitive data from exception messages', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()
      const mockEvent = {
        exception: {
          values: [
            {
              value: 'Error with email: user@example.com',
              type: 'Error',
            },
          ],
        },
      }

      const filteredEvent = config.beforeSend!(mockEvent as any, {}) as any

      expect(filteredEvent?.exception?.values?.[0]?.value).toContain('[EMAIL_REDACTED]')
      expect(filteredEvent?.exception?.values?.[0]?.value).not.toContain('user@example.com')
    })

    it('should filter sensitive data from request data', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()
      const mockEvent = {
        request: {
          data: {
            email: 'test@example.com',
            password: 'secret123',
            username: 'john_doe',
          },
        },
      }

      const filteredEvent = config.beforeSend!(mockEvent as any, {}) as any

      expect(filteredEvent?.request?.data?.email).toBe('[EMAIL_REDACTED]')
      expect(filteredEvent?.request?.data?.password).toBe('[REDACTED]')
      expect(filteredEvent?.request?.data?.username).toBe('john_doe')
    })

    it('should filter sensitive data from breadcrumbs', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()
      const mockEvent = {
        breadcrumbs: [
          {
            message: 'User card: 4532-1488-0343-6467',
            category: 'payment',
            timestamp: Date.now(),
          },
        ],
      }

      const filteredEvent = config.beforeSend!(mockEvent as any, {}) as any

      expect(filteredEvent?.breadcrumbs?.[0]?.message).toContain('[CREDITCARD_REDACTED]')
      expect(filteredEvent?.breadcrumbs?.[0]?.message).not.toContain('4532-1488-0343-6467')
    })

    it('should filter sensitive field names from contexts', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()
      const mockEvent = {
        contexts: {
          user: {
            api_key: 'sk-test123',
            credit_card: '4532-1488-0343-6467',
          },
        },
      }

      const filteredEvent = config.beforeSend!(mockEvent as any, {}) as any

      expect(filteredEvent?.contexts?.user?.api_key).toBe('[REDACTED]')
      expect(filteredEvent?.contexts?.user?.credit_card).toBe('[CREDITCARD_REDACTED]')
    })

    it('should handle null events gracefully', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()

      expect(config.beforeSend!(null as any, {})).toBeNull()
    })

    it('should preserve safe data without modification', () => {
      vi.stubEnv('VITE_SENTRY_DSN', 'https://test@sentry.io/123')

      const config = getSentryConfig()
      const mockEvent = {
        event_id: 'test-123',
        message: 'Safe error without PII',
        request: {
          url: 'https://example.com/api/users',
          method: 'GET',
        },
      }

      const filteredEvent = config.beforeSend!(mockEvent as any, {}) as any

      expect(filteredEvent?.event_id).toBe('test-123')
      expect(filteredEvent?.message).toBe('Safe error without PII')
      expect(filteredEvent?.request?.url).toBe('https://example.com/api/users')
    })
  })
})

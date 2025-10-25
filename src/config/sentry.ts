// src/config/sentry.ts
import type { BrowserOptions } from '@sentry/react'

/**
 * Sentry Configuration
 * Production-only error monitoring configuration
 */
export interface SentryConfig extends BrowserOptions {
  enabled: boolean
}

/**
 * Get Sentry configuration from environment variables
 * @returns Sentry configuration object
 */
export function getSentryConfig(): SentryConfig {
  const dsn = import.meta.env.VITE_SENTRY_DSN || ''
  const environment = import.meta.env.MODE || 'development'
  const isProduction = import.meta.env.PROD === true

  return {
    dsn,
    environment,
    enabled: isProduction && dsn !== '',
    release: `dev-utils-hub@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
    tracesSampleRate: 1.0,
    beforeSend(event) {
      // Placeholder for data filtering - will be implemented in Task 17
      return event
    },
  }
}

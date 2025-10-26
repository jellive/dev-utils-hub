// src/config/sentry.ts
import type { BrowserOptions, ErrorEvent, EventHint } from '@sentry/react';
import { filterSensitiveData } from './sentryFilters';

/**
 * Sentry Configuration
 * Production-only error monitoring configuration with privacy protection
 */
export interface SentryConfig extends BrowserOptions {
  enabled: boolean;
}

/**
 * Get Sentry configuration from environment variables
 * @returns Sentry configuration object with sensitive data filtering
 */
export function getSentryConfig(): SentryConfig {
  const dsn = import.meta.env.VITE_SENTRY_DSN || '';
  const environment = import.meta.env.MODE || 'development';
  const isProduction = import.meta.env.PROD === true;

  return {
    dsn,
    environment,
    // Enable Sentry if DSN is provided (works in both dev and production)
    enabled: dsn !== '',
    release: `dev-utils-hub@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
    tracesSampleRate: 1.0,
    // Enable debug mode in development for easier testing
    debug: !isProduction,

    /**
     * beforeSend hook - filters sensitive data before sending to Sentry
     * Implements comprehensive PII (Personally Identifiable Information) protection
     */
    beforeSend(event: ErrorEvent, _hint: EventHint) {
      // Handle null/undefined events gracefully
      if (!event) {
        return event;
      }

      try {
        // Filter exception messages
        if (event.exception?.values) {
          event.exception.values = event.exception.values.map((exception) => ({
            ...exception,
            value: filterSensitiveData(exception.value) as string,
          }));
        }

        // Filter error message
        if (event.message) {
          event.message = filterSensitiveData(event.message) as string;
        }

        // Filter request data
        if (event.request) {
          event.request = filterSensitiveData(event.request) as typeof event.request;
        }

        // Filter breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) =>
            filterSensitiveData(breadcrumb),
          ) as typeof event.breadcrumbs;
        }

        // Filter contexts (user, custom, etc.)
        if (event.contexts) {
          event.contexts = filterSensitiveData(event.contexts) as typeof event.contexts;
        }

        // Filter extra data
        if (event.extra) {
          event.extra = filterSensitiveData(event.extra) as typeof event.extra;
        }

        // Filter tags
        if (event.tags) {
          event.tags = filterSensitiveData(event.tags) as typeof event.tags;
        }

        return event;
      } catch (error) {
        // If filtering fails, log error but still send the event
        // to avoid losing error reporting entirely
        console.error('Sentry beforeSend filter error:', error);
        return event;
      }
    },
  };
}

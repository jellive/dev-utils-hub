/**
 * Sentry Data Filtering - Privacy and Security
 *
 * This module provides utilities to detect and redact sensitive information
 * from error reports before they are sent to Sentry, ensuring compliance with
 * privacy regulations and security best practices.
 */

/**
 * Regular expression patterns for detecting common types of sensitive data
 * Note: Using functions to create new RegExp instances to avoid lastIndex issues
 */
export const sensitivePatterns = {
  // Email addresses
  get email() {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  },

  // Credit card numbers (supports various formats with or without separators)
  get creditCard() {
    return /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  },

  // Social Security Numbers (XXX-XX-XXXX format)
  get ssn() {
    return /\b\d{3}-\d{2}-\d{4}\b/g;
  },

  // Phone numbers (various formats)
  get phone() {
    return /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
  },

  // IP addresses (IPv4)
  get ipAddress() {
    return /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  },

  // API keys, tokens, and bearer tokens (common patterns)
  get apiKey() {
    return /\b(?:sk|pk|token|bearer)[-_][a-zA-Z0-9]{10,}\b|Bearer\s+[a-zA-Z0-9_.-]+|eyJ[a-zA-Z0-9_.-]+/gi;
  },
};

/**
 * List of field names that commonly contain sensitive information
 */
const sensitiveFieldNames = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'api_key',
  'apikey',
  'access_token',
  'accesstoken',
  'auth',
  'authorization',
  'credentials',
  'credit_card',
  'creditcard',
  'ssn',
  'social_security',
  'token',
  'private_key',
  'privatekey',
];

/**
 * Check if a value contains any sensitive data based on regex patterns
 */
export function containsSensitiveData(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return Object.values(sensitivePatterns).some(pattern => pattern.test(value));
}

/**
 * Scrub sensitive values by replacing them with redacted placeholders
 */
export function scrubSensitiveValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  let scrubbedValue = value;

  // Replace each pattern with appropriate redaction placeholder
  scrubbedValue = scrubbedValue.replace(sensitivePatterns.email, '[EMAIL_REDACTED]');
  scrubbedValue = scrubbedValue.replace(sensitivePatterns.creditCard, '[CREDITCARD_REDACTED]');
  scrubbedValue = scrubbedValue.replace(sensitivePatterns.ssn, '[SSN_REDACTED]');
  // Phone pattern includes capturing groups, replace the whole match
  scrubbedValue = scrubbedValue.replace(sensitivePatterns.phone, '[PHONE_REDACTED]');
  scrubbedValue = scrubbedValue.replace(sensitivePatterns.ipAddress, '[IP_REDACTED]');
  scrubbedValue = scrubbedValue.replace(sensitivePatterns.apiKey, '[API_KEY_REDACTED]');

  return scrubbedValue;
}

/**
 * Recursively filter sensitive data from objects, arrays, and nested structures
 */
export function filterSensitiveData(data: unknown, seen = new WeakSet()): unknown {
  // Handle null and undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return scrubSensitiveValue(data);
  }

  // Handle circular references
  if (seen.has(data as object)) {
    return '[Circular]';
  }
  seen.add(data as object);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => filterSensitiveData(item, seen));
  }

  // Handle Error objects specially
  if (data instanceof Error) {
    return {
      name: data.name,
      message: scrubSensitiveValue(data.message) as string,
      stack: scrubSensitiveValue(data.stack),
    };
  }

  // Handle regular objects
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if field name is in sensitive list - if so, always redact
    const isSensitiveField = sensitiveFieldNames.some(fieldName => lowerKey.includes(fieldName));

    if (isSensitiveField) {
      // For sensitive field names, only use specific patterns for very specific data types
      // (credit card, SSN) - otherwise use generic redaction
      if (typeof value === 'string') {
        const hasCreditCard = sensitivePatterns.creditCard.test(value);
        const hasSSN = sensitivePatterns.ssn.test(value);

        if (hasCreditCard) {
          filtered[key] = '[CREDITCARD_REDACTED]';
        } else if (hasSSN) {
          filtered[key] = '[SSN_REDACTED]';
        } else {
          filtered[key] = '[REDACTED]';
        }
      } else {
        filtered[key] = '[REDACTED]';
      }
      continue;
    }

    // Recursively filter nested objects/arrays
    if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value, seen);
    } else {
      // Scrub string values
      filtered[key] = scrubSensitiveValue(value);
    }
  }

  return filtered;
}

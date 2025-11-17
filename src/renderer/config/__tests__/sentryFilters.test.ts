import { describe, it, expect } from 'vitest';
import {
  sensitivePatterns,
  containsSensitiveData,
  scrubSensitiveValue,
  filterSensitiveData,
} from '../sentryFilters';

describe('sentryFilters - Sensitive Data Patterns', () => {
  describe('sensitivePatterns', () => {
    it('should detect email addresses', () => {
      expect(sensitivePatterns.email.test('user@example.com')).toBe(true);
      expect(sensitivePatterns.email.test('test.user+tag@domain.co.uk')).toBe(true);
      expect(sensitivePatterns.email.test('not-an-email')).toBe(false);
    });

    it('should detect credit card numbers', () => {
      expect(sensitivePatterns.creditCard.test('4532-1488-0343-6467')).toBe(true);
      expect(sensitivePatterns.creditCard.test('4532148803436467')).toBe(true);
      expect(sensitivePatterns.creditCard.test('1234')).toBe(false);
    });

    it('should detect social security numbers', () => {
      expect(sensitivePatterns.ssn.test('123-45-6789')).toBe(true);
      expect(sensitivePatterns.ssn.test('123456789')).toBe(false);
    });

    it('should detect phone numbers', () => {
      expect(sensitivePatterns.phone.test('+1-555-123-4567')).toBe(true);
      expect(sensitivePatterns.phone.test('(555) 123-4567')).toBe(true);
      expect(sensitivePatterns.phone.test('555-123-4567')).toBe(true);
      expect(sensitivePatterns.phone.test('123')).toBe(false);
    });

    it('should detect IP addresses', () => {
      expect(sensitivePatterns.ipAddress.test('192.168.1.1')).toBe(true);
      expect(sensitivePatterns.ipAddress.test('10.0.0.1')).toBe(true);
      expect(sensitivePatterns.ipAddress.test('256.1.1.1')).toBe(false);
    });

    it('should detect API keys and tokens', () => {
      expect(sensitivePatterns.apiKey.test('sk-abc123def456ghi789')).toBe(true);
      expect(sensitivePatterns.apiKey.test('token_abc123def456')).toBe(true);
      expect(sensitivePatterns.apiKey.test('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(
        true,
      );
      expect(sensitivePatterns.apiKey.test('short')).toBe(false);
    });
  });

  describe('containsSensitiveData', () => {
    it('should return true for strings containing email', () => {
      expect(containsSensitiveData('Contact us at user@example.com')).toBe(true);
    });

    it('should return true for strings containing credit card', () => {
      expect(containsSensitiveData('Card: 4532-1488-0343-6467')).toBe(true);
    });

    it('should return false for clean strings', () => {
      expect(containsSensitiveData('This is a safe message')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(containsSensitiveData(null)).toBe(false);
      expect(containsSensitiveData(undefined)).toBe(false);
    });

    it('should handle numbers', () => {
      expect(containsSensitiveData(123456789)).toBe(false);
    });
  });

  describe('scrubSensitiveValue', () => {
    it('should redact email addresses', () => {
      expect(scrubSensitiveValue('user@example.com')).toBe('[EMAIL_REDACTED]');
      expect(scrubSensitiveValue('Contact: test@domain.com')).toContain('[EMAIL_REDACTED]');
    });

    it('should redact credit card numbers', () => {
      expect(scrubSensitiveValue('4532-1488-0343-6467')).toBe('[CREDITCARD_REDACTED]');
    });

    it('should redact multiple patterns in same string', () => {
      const result = scrubSensitiveValue(
        'Email: user@example.com, Card: 4532-1488-0343-6467',
      );
      expect(result).toContain('[EMAIL_REDACTED]');
      expect(result).toContain('[CREDITCARD_REDACTED]');
      expect(result).not.toContain('user@example.com');
      expect(result).not.toContain('4532-1488-0343-6467');
    });

    it('should return original value if no sensitive data found', () => {
      expect(scrubSensitiveValue('Safe message')).toBe('Safe message');
    });

    it('should handle non-string values', () => {
      expect(scrubSensitiveValue(null)).toBe(null);
      expect(scrubSensitiveValue(undefined)).toBe(undefined);
      expect(scrubSensitiveValue(123)).toBe(123);
    });
  });

  describe('filterSensitiveData', () => {
    it('should recursively filter sensitive data from objects', () => {
      const data = {
        email: 'user@example.com',
        card: '4532-1488-0343-6467',
        safe: 'This is safe',
      };

      const filtered = filterSensitiveData(data) as Record<string, unknown>;
      expect(filtered.email).toBe('[EMAIL_REDACTED]');
      expect(filtered.card).toBe('[CREDITCARD_REDACTED]');
      expect(filtered.safe).toBe('This is safe');
    });

    it('should filter nested objects', () => {
      const data = {
        user: {
          email: 'user@example.com',
          profile: {
            phone: '+1-555-123-4567',
          },
        },
      };

      const filtered = filterSensitiveData(data) as any;
      expect(filtered.user.email).toBe('[EMAIL_REDACTED]');
      expect(filtered.user.profile.phone).toBe('[PHONE_REDACTED]');
    });

    it('should filter arrays', () => {
      const data = {
        contacts: ['user1@example.com', 'user2@example.com', 'safe message'],
      };

      const filtered = filterSensitiveData(data) as any;
      expect(filtered.contacts[0]).toBe('[EMAIL_REDACTED]');
      expect(filtered.contacts[1]).toBe('[EMAIL_REDACTED]');
      expect(filtered.contacts[2]).toBe('safe message');
    });

    it('should handle circular references', () => {
      const data: any = { name: 'test' };
      data.self = data;

      const filtered = filterSensitiveData(data) as any;
      expect(filtered.name).toBe('test');
      expect(filtered.self).toBe('[Circular]');
    });

    it('should preserve non-sensitive primitive types', () => {
      const data = {
        number: 123,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
      };

      const filtered = filterSensitiveData(data) as any;
      expect(filtered.number).toBe(123);
      expect(filtered.boolean).toBe(true);
      expect(filtered.nullValue).toBe(null);
      expect(filtered.undefinedValue).toBe(undefined);
    });

    it('should redact common PII field names', () => {
      const data = {
        password: 'secret123',
        api_key: 'sk-test123',
        authorization: 'Bearer token123',
        credit_card: '4532-1488-0343-6467',
        ssn: '123-45-6789',
      };

      const filtered = filterSensitiveData(data) as any;
      expect(filtered.password).toBe('[REDACTED]');
      expect(filtered.api_key).toBe('[REDACTED]');
      expect(filtered.authorization).toBe('[REDACTED]');
      expect(filtered.credit_card).toBe('[CREDITCARD_REDACTED]');
      expect(filtered.ssn).toBe('[SSN_REDACTED]');
    });

    it('should handle Error objects', () => {
      const error = new Error('Error with email: user@example.com');
      const filtered = filterSensitiveData(error) as any;

      expect(filtered.message).toContain('[EMAIL_REDACTED]');
      expect(filtered.message).not.toContain('user@example.com');
    });
  });
});

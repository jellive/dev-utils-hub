// src/components/tools/SentryToolkit/utils/__tests__/dsnParser.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  parseDSN,
  validateDSN,
  testDSNConnection,
  maskPublicKey,
  maskDSN,
} from '../dsnParser'

describe('parseDSN', () => {
  it('should parse valid HTTPS DSN correctly', () => {
    const dsn = 'https://1a2b3c4d5e6f7g8h9i0j@o123456.ingest.sentry.io/1234567'
    const result = parseDSN(dsn)

    expect(result).toEqual({
      protocol: 'https',
      publicKey: '1a2b3c4d5e6f7g8h9i0j',
      host: 'o123456.ingest.sentry.io',
      projectId: '1234567',
      storeEndpoint: 'https://o123456.ingest.sentry.io/api/1234567/store/',
      envelopeEndpoint: 'https://o123456.ingest.sentry.io/api/1234567/envelope/',
    })
  })

  it('should parse valid HTTP DSN correctly', () => {
    const dsn = 'http://testkey123@localhost:9000/42'
    const result = parseDSN(dsn)

    expect(result).toEqual({
      protocol: 'http',
      publicKey: 'testkey123',
      host: 'localhost:9000',
      projectId: '42',
      storeEndpoint: 'http://localhost:9000/api/42/store/',
      envelopeEndpoint: 'http://localhost:9000/api/42/envelope/',
    })
  })

  it('should parse DSN with complex public key', () => {
    const dsn = 'https://abc-123_DEF.456@sentry.example.com/999'
    const result = parseDSN(dsn)

    expect(result?.publicKey).toBe('abc-123_DEF.456')
  })

  it('should handle DSN with trailing/leading whitespace', () => {
    const dsn = '  https://key123@host.com/123  '
    const result = parseDSN(dsn)

    expect(result).not.toBeNull()
    expect(result?.protocol).toBe('https')
  })

  it('should return null for invalid DSN format (missing @)', () => {
    const dsn = 'https://key123host.com/123'
    const result = parseDSN(dsn)

    expect(result).toBeNull()
  })

  it('should return null for invalid DSN format (missing protocol)', () => {
    const dsn = 'key123@host.com/123'
    const result = parseDSN(dsn)

    expect(result).toBeNull()
  })

  it('should return null for empty string', () => {
    const result = parseDSN('')

    expect(result).toBeNull()
  })

  it('should return null for whitespace-only string', () => {
    const result = parseDSN('   ')

    expect(result).toBeNull()
  })

  it('should return null for non-string input', () => {
    const result = parseDSN(null as any)

    expect(result).toBeNull()
  })
})

describe('validateDSN', () => {
  it('should validate correct DSN', () => {
    const dsn = 'https://1a2b3c4d5e6f7g8h9i0j@o123456.ingest.sentry.io/1234567'
    const result = validateDSN(dsn)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.parsed).toBeDefined()
  })

  it('should reject DSN without protocol', () => {
    const dsn = 'key123@host.com/123'
    const result = validateDSN(dsn)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('DSN must start with http:// or https://')
  })

  it('should reject DSN without @ symbol', () => {
    const dsn = 'https://key123host.com/123'
    const result = validateDSN(dsn)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('DSN must contain @ symbol to separate public key and host')
  })

  it('should reject empty string', () => {
    const result = validateDSN('')

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('DSN cannot be empty or whitespace only')
  })

  it('should reject non-string input', () => {
    const result = validateDSN(undefined as any)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('DSN must be a non-empty string')
  })

  it('should warn about short public key', () => {
    const dsn = 'https://short@host.com/123'
    const result = validateDSN(dsn)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Public key appears to be too short (minimum 8 characters)')
  })

  it('should warn about non-numeric project ID', () => {
    const dsn = 'https://longenoughkey@host.com/abc123'
    const result = validateDSN(dsn)

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Project ID must be numeric')
  })
})

describe('testDSNConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return success for valid connection (200 OK)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    globalThis.fetch = mockFetch

    const dsn = {
      protocol: 'https' as const,
      publicKey: 'testkey',
      host: 'sentry.io',
      projectId: '123',
      storeEndpoint: 'https://sentry.io/api/123/store/',
      envelopeEndpoint: 'https://sentry.io/api/123/envelope/',
    }

    const result = await testDSNConnection(dsn)

    expect(result.success).toBe(true)
    expect(result.statusCode).toBe(200)
    expect(result.responseTime).toBeGreaterThan(0)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sentry.io/api/123/store/',
      expect.objectContaining({
        method: 'OPTIONS',
        headers: {
          'X-Sentry-Auth': 'Sentry sentry_key=testkey, sentry_version=7',
        },
      })
    )
  })

  it('should return success for 405 Method Not Allowed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 405,
    })
    globalThis.fetch = mockFetch

    const dsn = {
      protocol: 'https' as const,
      publicKey: 'testkey',
      host: 'sentry.io',
      projectId: '123',
      storeEndpoint: 'https://sentry.io/api/123/store/',
      envelopeEndpoint: 'https://sentry.io/api/123/envelope/',
    }

    const result = await testDSNConnection(dsn)

    expect(result.success).toBe(true)
    expect(result.statusCode).toBe(405)
  })

  it('should handle network error', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
    globalThis.fetch = mockFetch

    const dsn = {
      protocol: 'https' as const,
      publicKey: 'testkey',
      host: 'invalid.sentry.io',
      projectId: '123',
      storeEndpoint: 'https://invalid.sentry.io/api/123/store/',
      envelopeEndpoint: 'https://invalid.sentry.io/api/123/envelope/',
    }

    const result = await testDSNConnection(dsn)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error or CORS issue')
    expect(result.responseTime).toBeGreaterThan(0)
  })

  it('should handle timeout', async () => {
    const timeoutError = new Error('Timeout')
    timeoutError.name = 'AbortError'
    const mockFetch = vi.fn().mockRejectedValue(timeoutError)
    globalThis.fetch = mockFetch

    const dsn = {
      protocol: 'https' as const,
      publicKey: 'testkey',
      host: 'slow.sentry.io',
      projectId: '123',
      storeEndpoint: 'https://slow.sentry.io/api/123/store/',
      envelopeEndpoint: 'https://slow.sentry.io/api/123/envelope/',
    }

    const result = await testDSNConnection(dsn)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Connection timeout (5s)')
  })

  it('should return failure for 404 Not Found', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    globalThis.fetch = mockFetch

    const dsn = {
      protocol: 'https' as const,
      publicKey: 'testkey',
      host: 'sentry.io',
      projectId: '999999',
      storeEndpoint: 'https://sentry.io/api/999999/store/',
      envelopeEndpoint: 'https://sentry.io/api/999999/envelope/',
    }

    const result = await testDSNConnection(dsn)

    expect(result.success).toBe(false)
    expect(result.statusCode).toBe(404)
  })
})

describe('maskPublicKey', () => {
  it('should mask public key showing last 4 characters', () => {
    const publicKey = '1a2b3c4d5e6f7g8h9i0j'
    const result = maskPublicKey(publicKey)

    expect(result).toBe('****************9i0j')
  })

  it('should mask public key with custom visible characters', () => {
    const publicKey = '1a2b3c4d5e6f7g8h9i0j'
    const result = maskPublicKey(publicKey, 6)

    expect(result).toBe('**************8h9i0j')
  })

  it('should return original key if shorter than visible chars', () => {
    const publicKey = 'abc'
    const result = maskPublicKey(publicKey, 4)

    expect(result).toBe('abc')
  })

  it('should handle empty string', () => {
    const result = maskPublicKey('')

    expect(result).toBe('')
  })
})

describe('maskDSN', () => {
  it('should mask DSN public key', () => {
    const dsn = 'https://1a2b3c4d5e6f7g8h9i0j@o123456.ingest.sentry.io/1234567'
    const result = maskDSN(dsn)

    expect(result).toBe('https://****************9i0j@o123456.ingest.sentry.io/1234567')
  })

  it('should return original string for invalid DSN', () => {
    const dsn = 'invalid-dsn-format'
    const result = maskDSN(dsn)

    expect(result).toBe('invalid-dsn-format')
  })

  it('should mask HTTP DSN', () => {
    const dsn = 'http://testkey123@localhost:9000/42'
    const result = maskDSN(dsn)

    expect(result).toBe('http://******y123@localhost:9000/42')
  })
})

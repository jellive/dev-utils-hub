// src/components/tools/SentryToolkit/utils/__tests__/envelopeBuilder.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildEnvelope, sendEnvelope } from '../envelopeBuilder'
import { buildEvent } from '../eventBuilder'
import type { ParsedDSN } from '../../types'

describe('buildEnvelope', () => {
  it('should create envelope with event', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)

    expect(envelope).toBeDefined()
    expect(typeof envelope).toBe('string')
  })

  it('should have proper envelope structure', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)
    const lines = envelope.split('\n')

    // Envelope consists of header + item header + item payload
    expect(lines.length).toBeGreaterThanOrEqual(3)
  })

  it('should include event_id in envelope header', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)
    const lines = envelope.split('\n')
    const header = JSON.parse(lines[0])

    expect(header.event_id).toBe(event.event_id)
  })

  it('should include SDK metadata in envelope header', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)
    const lines = envelope.split('\n')
    const header = JSON.parse(lines[0])

    expect(header.sdk).toBeDefined()
    expect(header.sdk.name).toBeDefined()
    expect(header.sdk.version).toBeDefined()
  })

  it('should include item header with type', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)
    const lines = envelope.split('\n')
    const itemHeader = JSON.parse(lines[1])

    expect(itemHeader.type).toBe('event')
  })

  it('should include event payload', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)
    const lines = envelope.split('\n')
    const payload = JSON.parse(lines[2])

    expect(payload.event_id).toBe(event.event_id)
    expect(payload.level).toBe('error')
    expect(payload.message).toBe('Test error')
  })

  it('should include timestamp in envelope header', () => {
    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const envelope = buildEnvelope(event)
    const lines = envelope.split('\n')
    const header = JSON.parse(lines[0])

    expect(header.sent_at).toBeDefined()
  })
})

describe('sendEnvelope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should send envelope to DSN endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'testkey123',
      host: 'sentry.io',
      projectId: '123',
      storeEndpoint: 'https://sentry.io/api/123/store/',
      envelopeEndpoint: 'https://sentry.io/api/123/envelope/',
    }

    const event = buildEvent({
      level: 'error',
      message: 'Test error',
    })

    const result = await sendEnvelope(dsn, event)

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sentry.io/api/123/envelope/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': expect.stringContaining('Sentry sentry_key=testkey123'),
        }),
      })
    )
  })

  it('should include proper X-Sentry-Auth header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'mykey',
      host: 'sentry.io',
      projectId: '456',
      storeEndpoint: 'https://sentry.io/api/456/store/',
      envelopeEndpoint: 'https://sentry.io/api/456/envelope/',
    }

    const event = buildEvent({
      level: 'info',
      message: 'Test',
    })

    await sendEnvelope(dsn, event)

    const call = mockFetch.mock.calls[0]
    const headers = call[1].headers

    expect(headers['X-Sentry-Auth']).toMatch(/sentry_key=mykey/)
    expect(headers['X-Sentry-Auth']).toMatch(/sentry_version=7/)
  })

  it('should return success for 200 response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'key',
      host: 'sentry.io',
      projectId: '1',
      storeEndpoint: 'https://sentry.io/api/1/store/',
      envelopeEndpoint: 'https://sentry.io/api/1/envelope/',
    }

    const event = buildEvent({ level: 'error', message: 'Test' })
    const result = await sendEnvelope(dsn, event)

    expect(result.success).toBe(true)
    expect(result.eventId).toBe(event.event_id)
  })

  it('should handle network errors', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'key',
      host: 'sentry.io',
      projectId: '1',
      storeEndpoint: 'https://sentry.io/api/1/store/',
      envelopeEndpoint: 'https://sentry.io/api/1/envelope/',
    }

    const event = buildEvent({ level: 'error', message: 'Test' })
    const result = await sendEnvelope(dsn, event)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should handle 4xx errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'key',
      host: 'sentry.io',
      projectId: '1',
      storeEndpoint: 'https://sentry.io/api/1/store/',
      envelopeEndpoint: 'https://sentry.io/api/1/envelope/',
    }

    const event = buildEvent({ level: 'error', message: 'Test' })
    const result = await sendEnvelope(dsn, event)

    expect(result.success).toBe(false)
    expect(result.statusCode).toBe(400)
  })

  it('should handle timeout', async () => {
    const timeoutError = new Error('Timeout')
    timeoutError.name = 'AbortError'
    const mockFetch = vi.fn().mockRejectedValue(timeoutError)
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'key',
      host: 'sentry.io',
      projectId: '1',
      storeEndpoint: 'https://sentry.io/api/1/store/',
      envelopeEndpoint: 'https://sentry.io/api/1/envelope/',
    }

    const event = buildEvent({ level: 'error', message: 'Test' })
    const result = await sendEnvelope(dsn, event)

    expect(result.success).toBe(false)
    expect(result.error).toContain('timeout')
  })

  it('should return event ID on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    })
    global.fetch = mockFetch

    const dsn: ParsedDSN = {
      protocol: 'https',
      publicKey: 'key',
      host: 'sentry.io',
      projectId: '1',
      storeEndpoint: 'https://sentry.io/api/1/store/',
      envelopeEndpoint: 'https://sentry.io/api/1/envelope/',
    }

    const event = buildEvent({ level: 'error', message: 'Test' })
    const result = await sendEnvelope(dsn, event)

    expect(result.eventId).toBe(event.event_id)
  })
})

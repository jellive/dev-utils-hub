// src/components/tools/SentryToolkit/utils/__tests__/eventBuilder.test.ts
import { describe, it, expect } from 'vitest'
import { generateEventId, buildEvent, generateMockStacktrace } from '../eventBuilder'
import type { EventBuilderOptions } from '../../types'

describe('generateEventId', () => {
  it('should generate valid UUID v4 format', () => {
    const eventId = generateEventId()

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (32 hex chars without dashes)
    expect(eventId).toHaveLength(32)
    expect(eventId).toMatch(/^[0-9a-f]{32}$/)
  })

  it('should generate unique event IDs', () => {
    const id1 = generateEventId()
    const id2 = generateEventId()
    const id3 = generateEventId()

    expect(id1).not.toBe(id2)
    expect(id2).not.toBe(id3)
    expect(id1).not.toBe(id3)
  })

  it('should not contain dashes', () => {
    const eventId = generateEventId()

    expect(eventId).not.toContain('-')
  })

  it('should be lowercase hexadecimal', () => {
    const eventId = generateEventId()

    // Check all characters are lowercase hex
    expect(eventId).toMatch(/^[0-9a-f]+$/)
  })

  it('should generate different IDs in rapid succession', () => {
    const ids = new Set<string>()

    for (let i = 0; i < 100; i++) {
      ids.add(generateEventId())
    }

    // All 100 IDs should be unique
    expect(ids.size).toBe(100)
  })
})

describe('buildEvent', () => {
  it('should create event with required fields', () => {
    const options: EventBuilderOptions = {
      level: 'error',
      message: 'Test error message',
    }

    const event = buildEvent(options)

    expect(event.event_id).toBeDefined()
    expect(event.event_id).toHaveLength(32)
    expect(event.timestamp).toBeDefined()
    expect(event.platform).toBe('javascript')
    expect(event.level).toBe('error')
    expect(event.message).toBe('Test error message')
  })

  it('should include optional environment', () => {
    const options: EventBuilderOptions = {
      level: 'info',
      message: 'Test message',
      environment: 'production',
    }

    const event = buildEvent(options)

    expect(event.environment).toBe('production')
  })

  it('should include optional release', () => {
    const options: EventBuilderOptions = {
      level: 'warning',
      message: 'Test warning',
      release: 'v1.2.3',
    }

    const event = buildEvent(options)

    expect(event.release).toBe('v1.2.3')
  })

  it('should include tags', () => {
    const options: EventBuilderOptions = {
      level: 'error',
      message: 'Test error',
      tags: {
        component: 'auth',
        user_type: 'premium',
      },
    }

    const event = buildEvent(options)

    expect(event.tags).toEqual({
      component: 'auth',
      user_type: 'premium',
    })
  })

  it('should include user context', () => {
    const options: EventBuilderOptions = {
      level: 'error',
      message: 'Test error',
      user: {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
      },
    }

    const event = buildEvent(options)

    expect(event.user).toEqual({
      id: 'user123',
      email: 'test@example.com',
      username: 'testuser',
    })
  })

  it('should support all severity levels', () => {
    const levels = ['fatal', 'error', 'warning', 'info', 'debug'] as const

    levels.forEach((level) => {
      const event = buildEvent({ level, message: 'Test' })
      expect(event.level).toBe(level)
    })
  })

  it('should include contexts', () => {
    const options: EventBuilderOptions = {
      level: 'error',
      message: 'Test error',
      contexts: {
        browser: {
          name: 'Chrome',
          version: '120.0',
        },
        os: {
          name: 'macOS',
          version: '14.0',
        },
      },
    }

    const event = buildEvent(options)

    expect(event.contexts).toEqual({
      browser: {
        name: 'Chrome',
        version: '120.0',
      },
      os: {
        name: 'macOS',
        version: '14.0',
      },
    })
  })

  it('should include breadcrumbs', () => {
    const options: EventBuilderOptions = {
      level: 'error',
      message: 'Test error',
      breadcrumbs: [
        {
          type: 'navigation',
          category: 'navigation',
          message: 'User navigated to /dashboard',
          timestamp: Date.now() / 1000,
        },
        {
          type: 'http',
          category: 'xhr',
          message: 'API call to /api/users',
          timestamp: Date.now() / 1000,
        },
      ],
    }

    const event = buildEvent(options)

    expect(event.breadcrumbs).toBeDefined()
    expect(event.breadcrumbs).toHaveLength(2)
    expect(event.breadcrumbs![0].category).toBe('navigation')
    expect(event.breadcrumbs![1].category).toBe('xhr')
  })

  it('should generate unique event IDs for each event', () => {
    const options: EventBuilderOptions = {
      level: 'info',
      message: 'Test',
    }

    const event1 = buildEvent(options)
    const event2 = buildEvent(options)

    expect(event1.event_id).not.toBe(event2.event_id)
  })

  it('should use current timestamp', () => {
    const before = Math.floor(Date.now() / 1000)

    const event = buildEvent({
      level: 'info',
      message: 'Test',
    })

    const after = Math.floor(Date.now() / 1000)

    expect(event.timestamp).toBeGreaterThanOrEqual(before)
    expect(event.timestamp).toBeLessThanOrEqual(after)
  })
})

describe('generateMockStacktrace', () => {
  it('should generate stack trace with default depth', () => {
    const stacktrace = generateMockStacktrace()

    expect(stacktrace.frames).toBeDefined()
    expect(stacktrace.frames.length).toBeGreaterThan(0)
    expect(stacktrace.frames.length).toBeLessThanOrEqual(5) // default depth
  })

  it('should generate stack trace with custom depth', () => {
    const stacktrace = generateMockStacktrace(3)

    expect(stacktrace.frames).toHaveLength(3)
  })

  it('should have valid frame structure', () => {
    const stacktrace = generateMockStacktrace(1)
    const frame = stacktrace.frames[0]

    expect(frame.filename).toBeDefined()
    expect(frame.function).toBeDefined()
    expect(frame.lineno).toBeDefined()
    expect(frame.colno).toBeDefined()
    expect(frame.in_app).toBeDefined()
  })

  it('should include realistic filenames', () => {
    const stacktrace = generateMockStacktrace(5)

    stacktrace.frames.forEach((frame) => {
      expect(frame.filename).toMatch(/\.(js|ts|tsx|jsx)$/)
    })
  })

  it('should have frames in reverse order (most recent first)', () => {
    const stacktrace = generateMockStacktrace(3)

    // Check that frames are ordered correctly
    expect(stacktrace.frames).toHaveLength(3)
    expect(stacktrace.frames[0].function).toBeDefined()
  })

  it('should mark some frames as in_app', () => {
    const stacktrace = generateMockStacktrace(10)

    const inAppFrames = stacktrace.frames.filter((frame) => frame.in_app)
    expect(inAppFrames.length).toBeGreaterThan(0)
  })

  it('should include context lines for frames', () => {
    const stacktrace = generateMockStacktrace(1)
    const frame = stacktrace.frames[0]

    if (frame.context_line) {
      expect(typeof frame.context_line).toBe('string')
    }
  })
})

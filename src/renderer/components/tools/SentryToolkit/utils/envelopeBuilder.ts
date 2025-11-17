// src/components/tools/SentryToolkit/utils/envelopeBuilder.ts
import type { Event } from '@sentry/types'
import type { ParsedDSN, EnvelopeSendResult } from '../types'

/**
 * Sentry Envelope 빌드 (Envelope Protocol)
 * @param event - Sentry Event 객체
 * @returns Envelope 문자열 (줄바꿈으로 구분된 JSON)
 */
export function buildEnvelope(event: Event): string {
  // Envelope Header
  const envelopeHeader = {
    event_id: event.event_id,
    sent_at: new Date().toISOString(),
    sdk: {
      name: 'sentry.javascript.browser',
      version: '7.0.0',
    },
  }

  // Item Header
  const itemHeader = {
    type: 'event',
    content_type: 'application/json',
  }

  // Item Payload (Event)
  const itemPayload = event

  // Envelope format: header\nitem_header\nitem_payload\n
  return [
    JSON.stringify(envelopeHeader),
    JSON.stringify(itemHeader),
    JSON.stringify(itemPayload),
  ].join('\n')
}

/**
 * Sentry Envelope 전송
 * @param dsn - Parsed DSN 객체
 * @param event - Sentry Event 객체
 * @returns 전송 결과
 */
export async function sendEnvelope(
  dsn: ParsedDSN,
  event: Event
): Promise<EnvelopeSendResult> {
  const envelope = buildEnvelope(event)

  // X-Sentry-Auth 헤더 생성
  const sentryAuth = `Sentry sentry_key=${dsn.publicKey}, sentry_version=7, sentry_client=sentry.javascript.browser/7.0.0`

  try {
    const response = await fetch(dsn.envelopeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': sentryAuth,
      },
      body: envelope,
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    })

    if (response.ok) {
      return {
        success: true,
        eventId: event.event_id,
      }
    } else {
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }
  } catch (error) {
    let errorMessage = 'Unknown error'

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        errorMessage = 'Request timeout (10s)'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error or CORS issue'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

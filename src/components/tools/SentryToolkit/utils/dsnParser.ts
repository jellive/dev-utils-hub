// src/components/tools/SentryToolkit/utils/dsnParser.ts
import type { ParsedDSN, DSNValidationResult, DSNConnectionResult } from '../types'

/**
 * DSN 형식: {PROTOCOL}://{PUBLIC_KEY}@{HOST}/{PATH}{PROJECT_ID}
 * 예시: https://1a2b3c4d5e6f7g8h9i0j@o123456.ingest.sentry.io/1234567
 */
const DSN_REGEX = /^(https?):\/\/([^@]+)@([^/]+)\/(.+)$/

/**
 * Sentry DSN 문자열을 파싱하여 구성 요소로 분해
 * @param dsn - Sentry DSN 문자열
 * @returns ParsedDSN 객체 또는 null (유효하지 않은 경우)
 */
export function parseDSN(dsn: string): ParsedDSN | null {
  // 입력값 기본 검증
  if (!dsn || typeof dsn !== 'string') {
    return null
  }

  // 공백 제거
  const trimmedDSN = dsn.trim()

  if (!trimmedDSN) {
    return null
  }

  // 정규식 매칭
  const match = trimmedDSN.match(DSN_REGEX)

  if (!match) {
    return null
  }

  const [, protocol, publicKey, host, projectId] = match

  // 추출된 값 검증
  if (!protocol || !publicKey || !host || !projectId) {
    return null
  }

  return {
    protocol: protocol as 'https' | 'http',
    publicKey,
    host,
    projectId,
    storeEndpoint: `${protocol}://${host}/api/${projectId}/store/`,
    envelopeEndpoint: `${protocol}://${host}/api/${projectId}/envelope/`,
  }
}

/**
 * DSN 문자열의 유효성을 검증
 * @param dsn - 검증할 DSN 문자열
 * @returns 검증 결과 객체
 */
export function validateDSN(dsn: string): DSNValidationResult {
  const errors: string[] = []

  // 기본 타입 검증
  if (typeof dsn !== 'string') {
    errors.push('DSN must be a non-empty string')
    return { valid: false, errors }
  }

  const trimmedDSN = dsn.trim()

  // 빈 문자열 체크
  if (!trimmedDSN) {
    errors.push('DSN cannot be empty or whitespace only')
    return { valid: false, errors }
  }

  // 프로토콜 검증
  if (!trimmedDSN.startsWith('http://') && !trimmedDSN.startsWith('https://')) {
    errors.push('DSN must start with http:// or https://')
  }

  // @ 기호 존재 여부 (public key 구분자)
  if (!trimmedDSN.includes('@')) {
    errors.push('DSN must contain @ symbol to separate public key and host')
  }

  // 파싱 시도
  const parsed = parseDSN(trimmedDSN)

  if (!parsed) {
    errors.push('Invalid DSN format. Expected: {protocol}://{public_key}@{host}/{project_id}')
    return { valid: false, errors }
  }

  // Public key 검증 (최소 길이)
  if (parsed.publicKey.length < 8) {
    errors.push('Public key appears to be too short (minimum 8 characters)')
  }

  // Project ID 검증 (숫자인지 확인)
  if (!/^\d+$/.test(parsed.projectId)) {
    errors.push('Project ID must be numeric')
  }

  return {
    valid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? parsed : undefined,
  }
}

/**
 * DSN 연결 테스트 (Sentry 엔드포인트 도달성 확인)
 * @param dsn - 테스트할 ParsedDSN 객체
 * @returns 연결 테스트 결과
 */
export async function testDSNConnection(
  dsn: ParsedDSN
): Promise<DSNConnectionResult> {
  const startTime = Date.now()

  try {
    // OPTIONS 요청으로 엔드포인트 존재 확인
    const response = await fetch(dsn.storeEndpoint, {
      method: 'OPTIONS',
      headers: {
        'X-Sentry-Auth': `Sentry sentry_key=${dsn.publicKey}, sentry_version=7`,
      },
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    })

    const responseTime = Math.max(1, Date.now() - startTime)

    return {
      success: response.ok || response.status === 405, // 405도 엔드포인트 존재를 의미
      statusCode: response.status,
      responseTime: Math.round(responseTime),
    }
  } catch (error) {
    const responseTime = Math.max(1, Date.now() - startTime)

    let errorMessage = 'Unknown error'

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        errorMessage = 'Connection timeout (5s)'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error or CORS issue'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      responseTime: Math.round(responseTime),
      error: errorMessage,
    }
  }
}

/**
 * Public Key 마스킹 (보안을 위해 일부만 표시)
 * @param publicKey - 마스킹할 public key
 * @param visibleChars - 표시할 끝 문자 수 (기본: 4)
 * @returns 마스킹된 public key
 */
export function maskPublicKey(publicKey: string, visibleChars: number = 4): string {
  if (!publicKey || publicKey.length <= visibleChars) {
    return publicKey
  }

  const maskedLength = publicKey.length - visibleChars
  const masked = '*'.repeat(maskedLength)
  const visible = publicKey.substring(maskedLength)

  return masked + visible
}

/**
 * DSN 문자열에서 public key 마스킹
 * @param dsn - 원본 DSN 문자열
 * @returns 마스킹된 DSN 문자열
 */
export function maskDSN(dsn: string): string {
  const parsed = parseDSN(dsn)

  if (!parsed) {
    return dsn
  }

  const maskedKey = maskPublicKey(parsed.publicKey)
  return `${parsed.protocol}://${maskedKey}@${parsed.host}/${parsed.projectId}`
}

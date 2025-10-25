// src/components/tools/SentryToolkit/utils/eventBuilder.ts
import type { Event, Stacktrace, StackFrame } from '@sentry/types'
import type { EventBuilderOptions } from '../types'

/**
 * Sentry event_id용 UUID v4 생성 (대시 없이 32자 hex)
 * @returns UUID v4 문자열 (대시 제거됨)
 */
export function generateEventId(): string {
  // UUID v4 생성 (crypto.randomUUID 사용)
  const uuid = crypto.randomUUID()

  // 대시 제거하여 32자 hex 문자열로 변환
  return uuid.replace(/-/g, '')
}

/**
 * Sentry 이벤트 객체 생성
 * @param options - 이벤트 생성 옵션
 * @returns Sentry Event 객체
 */
export function buildEvent(options: EventBuilderOptions): Event {
  const {
    level,
    message,
    environment,
    release,
    tags,
    user,
    contexts,
    breadcrumbs,
  } = options

  // 기본 이벤트 구조
  const event: Event = {
    event_id: generateEventId(),
    timestamp: Math.floor(Date.now() / 1000),
    platform: 'javascript',
    level,
    message,
  }

  // 선택적 필드 추가
  if (environment) {
    event.environment = environment
  }

  if (release) {
    event.release = release
  }

  if (tags) {
    event.tags = tags
  }

  if (user) {
    event.user = user
  }

  if (contexts) {
    event.contexts = contexts
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    event.breadcrumbs = breadcrumbs
  }

  return event
}

/**
 * Mock 스택 트레이스 생성 (테스트 이벤트용)
 * @param depth - 스택 프레임 깊이 (기본값: 3-5 랜덤)
 * @returns Sentry Stacktrace 객체
 */
export function generateMockStacktrace(depth?: number): Stacktrace {
  const frameDepth = depth ?? Math.floor(Math.random() * 3) + 3 // 3-5 사이 랜덤

  const mockFilenames = [
    'src/components/Button.tsx',
    'src/utils/api.ts',
    'src/hooks/useAuth.js',
    'src/services/eventService.ts',
    'node_modules/react-dom/index.js',
    'node_modules/axios/lib/core.js',
    'src/pages/Dashboard.tsx',
    'src/App.tsx',
  ]

  const mockFunctions = [
    'handleClick',
    'fetchUserData',
    'processRequest',
    'validateInput',
    'render',
    'useEffect',
    'onClick',
    'componentDidMount',
  ]

  const mockContextLines = [
    'const result = await api.fetch(url)',
    'throw new Error("Validation failed")',
    'return response.json()',
    'if (!user) { throw new Error("Unauthorized") }',
    'console.error(error)',
  ]

  const frames: StackFrame[] = []

  for (let i = 0; i < frameDepth; i++) {
    const isNodeModule = Math.random() > 0.6
    const filename = isNodeModule
      ? mockFilenames[Math.floor(Math.random() * 2) + 4] // node_modules files
      : mockFilenames[Math.floor(Math.random() * 4)] // src files

    const frame: StackFrame = {
      filename,
      function: mockFunctions[Math.floor(Math.random() * mockFunctions.length)],
      lineno: Math.floor(Math.random() * 200) + 1,
      colno: Math.floor(Math.random() * 80) + 1,
      in_app: !isNodeModule, // node_modules는 in_app: false
    }

    // 일부 프레임에 context_line 추가
    if (Math.random() > 0.5) {
      frame.context_line =
        mockContextLines[Math.floor(Math.random() * mockContextLines.length)]
    }

    frames.push(frame)
  }

  return { frames }
}

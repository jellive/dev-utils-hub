# Dev Utils Hub

개발자를 위한 올인원 유틸리티 도구 모음 - 오프라인에서도 사용 가능한 프로그레시브 웹 앱(PWA)

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [사용 가능한 도구](#사용-가능한-도구)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [테스트](#테스트)
- [배포](#배포)
- [성능 최적화](#성능-최적화)
- [브라우저 지원](#브라우저-지원)
- [에러 모니터링 (Sentry)](#에러-모니터링-sentry)
- [기여하기](#기여하기)
- [문제 해결](#문제-해결)

## 주요 기능

### 🚀 7가지 개발자 도구
- **JSON Formatter**: JSON 데이터 포맷팅 및 검증
- **JWT Decoder**: JWT 토큰 디코딩 및 검증
- **Base64 Converter**: Base64 인코딩/디코딩
- **Hash Generator**: MD5, SHA-256, SHA-512 해시 생성
- **UUID Generator**: UUID v4 생성
- **URL Encoder/Decoder**: URL 인코딩/디코딩
- **Timestamp Converter**: Unix 타임스탬프 변환

### 📱 PWA 기능
- **오프라인 지원**: Service Worker를 통한 완전한 오프라인 기능
- **설치 가능**: 모든 플랫폼에서 앱처럼 설치 가능
- **자동 업데이트**: 백그라운드에서 자동으로 업데이트

### ⚡ 성능 최적화
- **코드 분할**: React.lazy()를 통한 동적 임포트로 초기 번들 크기 32% 감소
- **번들 최적화**: 네이티브 구현으로 21% 번들 크기 감소 (310.78 KiB → 244.42 KiB)
- **빠른 로딩**: 3G 네트워크에서 3초 이내, WiFi에서 1초 이내 로딩

### 🎨 사용자 경험
- **다크 모드**: 시스템 설정에 따른 자동 테마 전환
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **접근성**: WCAG 2.1 AA 준수

## 기술 스택

### 프론트엔드
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Vite**: 빠른 개발 및 빌드
- **Tailwind CSS**: 유틸리티 우선 스타일링
- **Zustand**: 경량 상태 관리 (3KB)

### PWA
- **Vite PWA Plugin**: Service Worker 자동 생성
- **Workbox**: 고급 캐싱 전략

### 테스팅
- **Vitest**: 빠른 유닛 테스트 (162개 테스트)
- **Playwright**: 크로스 브라우저 E2E 테스트 (10개 테스트)
- **Testing Library**: 컴포넌트 테스트

### 배포 & CI/CD
- **Vercel**: 프로덕션 배포
- **GitHub Actions**: 자동화된 CI/CD 파이프라인

## 시작하기

### 사전 요구사항
- Node.js 20.x 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/dev-utils-hub.git
cd dev-utils-hub

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

개발 서버가 시작되면 브라우저에서 `http://localhost:5173`을 열어주세요.

### 프로덕션 빌드

```bash
# 빌드 실행
npm run build

# 빌드 미리보기
npm run preview
```

## 사용 가능한 도구

### 1. JSON Formatter

JSON 데이터를 읽기 쉽게 포맷팅하고 유효성을 검사합니다.

**사용법:**
1. 왼쪽 텍스트 영역에 JSON 데이터 입력
2. 자동으로 포맷팅된 결과가 오른쪽에 표시됩니다
3. "Copy" 버튼으로 결과 복사
4. "Clear" 버튼으로 입력 초기화

**기능:**
- 실시간 구문 검증
- 들여쓰기 자동 조정
- 오류 메시지 표시
- 원클릭 복사

### 2. JWT Decoder

JWT(JSON Web Token)를 디코딩하여 헤더와 페이로드를 확인합니다.

**사용법:**
1. JWT 토큰을 입력 필드에 붙여넣기
2. 자동으로 헤더와 페이로드가 디코딩됩니다
3. "Copy Header"/"Copy Payload" 버튼으로 각 부분 복사

**기능:**
- 자동 토큰 검증
- 헤더/페이로드 분리 표시
- 포맷팅된 JSON 출력
- 만료 시간 확인

### 3. Base64 Converter

텍스트를 Base64로 인코딩하거나 Base64를 텍스트로 디코딩합니다.

**사용법:**
1. "Encode" 또는 "Decode" 탭 선택
2. 텍스트 입력
3. 자동으로 변환된 결과 표시
4. "Copy" 버튼으로 결과 복사

**기능:**
- 양방향 변환 (인코딩/디코딩)
- UTF-8 지원
- 실시간 변환
- 오류 처리

### 4. Hash Generator

MD5, SHA-256, SHA-512 해시를 생성합니다.

**사용법:**
1. 텍스트 입력
2. 원하는 해시 알고리즘 선택
3. 생성된 해시 확인
4. "Copy" 버튼으로 복사

**기능:**
- 3가지 해시 알고리즘 (MD5, SHA-256, SHA-512)
- 네이티브 Web Crypto API 사용 (SHA-256, SHA-512)
- RFC 1321 준수 MD5 구현
- 실시간 해시 생성

**참고:**
- MD5는 암호학적으로 안전하지 않으므로 보안 목적으로는 SHA-256 또는 SHA-512를 사용하세요
- SHA-256, SHA-512는 브라우저 네이티브 Web Crypto API 사용

### 5. UUID Generator

UUID v4를 생성합니다.

**사용법:**
1. "Generate" 버튼 클릭
2. 생성된 UUID 확인
3. "Copy" 버튼으로 복사
4. 필요한 만큼 반복

**기능:**
- UUID v4 생성
- 암호학적으로 안전한 랜덤 생성
- 원클릭 생성 및 복사
- 중복 없는 고유 ID

### 6. URL Encoder/Decoder

URL을 인코딩하거나 디코딩합니다.

**사용법:**
1. "Encode" 또는 "Decode" 탭 선택
2. URL 또는 텍스트 입력
3. 자동 변환된 결과 확인
4. "Copy" 버튼으로 복사

**기능:**
- URL 안전 인코딩
- 양방향 변환
- 특수 문자 처리
- 실시간 변환

### 7. Timestamp Converter

Unix 타임스탬프와 사람이 읽을 수 있는 날짜 형식을 상호 변환합니다.

**사용법:**
1. "Timestamp to Date" 또는 "Date to Timestamp" 탭 선택
2. 값 입력 (타임스탬프 또는 날짜)
3. 변환된 결과 확인
4. "Copy" 버튼으로 복사

**기능:**
- 양방향 변환
- 밀리초 및 초 단위 지원
- ISO 8601 형식 지원
- 현재 시간 버튼

## 프로젝트 구조

```
dev-utils-hub/
├── src/
│   ├── components/
│   │   ├── tools/              # 7개 도구 컴포넌트
│   │   │   ├── JsonFormatter.tsx
│   │   │   ├── JwtDecoder.tsx
│   │   │   ├── Base64Converter.tsx
│   │   │   ├── HashGenerator.tsx
│   │   │   ├── UuidGenerator.tsx
│   │   │   ├── UrlEncoderDecoder.tsx
│   │   │   └── TimestampConverter.tsx
│   │   ├── DarkModeToggle.tsx  # 다크 모드 토글
│   │   └── InstallPWAButton.tsx # PWA 설치 버튼
│   ├── hooks/
│   │   ├── useDarkMode.ts      # 다크 모드 훅
│   │   └── usePWAInstall.ts    # PWA 설치 훅
│   ├── store/
│   │   └── themeStore.ts       # Zustand 테마 스토어
│   ├── utils/
│   │   └── hashUtils.ts        # 해시 유틸리티 (네이티브 MD5 구현)
│   ├── App.tsx                 # 메인 앱 컴포넌트
│   ├── main.tsx                # 앱 진입점
│   └── index.css               # 글로벌 스타일
├── e2e/                        # E2E 테스트
│   └── basic.spec.ts
├── public/                     # 정적 파일
│   ├── pwa-192x192.svg
│   ├── pwa-512x512.svg
│   └── favicon.ico
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── vercel.json                 # Vercel 배포 설정
├── vite.config.ts              # Vite 설정
├── playwright.config.ts        # Playwright 설정
├── tsconfig.json               # TypeScript 설정
└── package.json                # 의존성 관리
```

## 개발 가이드

### 스크립트

```bash
# 개발 서버 시작 (HMR 포함)
npm run dev

# 프로덕션 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint

# 유닛 테스트
npm test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트
npm run test:e2e

# 빌드 미리보기
npm run preview
```

### 코드 스타일

이 프로젝트는 다음 코딩 컨벤션을 따릅니다:

- **TypeScript Strict Mode**: 모든 타입 체크 활성화
- **ESLint**: React 및 TypeScript 규칙
- **Prettier**: 코드 포맷팅 (설정 포함)
- **Import 순서**: React → 외부 라이브러리 → 내부 모듈

### 새로운 도구 추가하기

1. `src/components/tools/` 디렉토리에 새 컴포넌트 생성
2. `App.tsx`에 새 도구 추가:
   ```typescript
   const NewTool = lazy(() =>
     import('./components/tools/NewTool').then((module) => ({ default: module.NewTool }))
   );

   const tools = [
     // 기존 도구...
     { id: 'new-tool', name: 'New Tool', component: NewTool },
   ];
   ```
3. 테스트 작성: `src/components/tools/__tests__/NewTool.test.tsx`
4. E2E 테스트 추가: `e2e/new-tool.spec.ts`

## 테스트

### 유닛 테스트

```bash
# 모든 테스트 실행
npm test

# Watch 모드로 실행
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

**테스트 커버리지:**
- 162개 유닛 테스트
- 7개 도구 컴포넌트 완전 커버
- 유틸리티 함수 100% 커버리지

### E2E 테스트

```bash
# E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행
npx playwright test --ui

# 특정 브라우저에서 실행
npx playwright test --project=chromium
```

**지원 브라우저:**
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Desktop Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## 배포

### Vercel 배포 (권장)

1. GitHub 저장소 생성 및 푸시
2. [Vercel](https://vercel.com)에 로그인
3. "New Project" → GitHub 저장소 선택
4. 프레임워크: Vite 자동 감지
5. Deploy 클릭

**자동 배포:**
- `main` 브랜치에 푸시하면 자동 배포
- PR 생성 시 미리보기 배포

### CI/CD 파이프라인

GitHub Actions를 통한 자동화:

1. **테스트 단계**
   - 린트 실행
   - 타입 체크
   - 유닛 테스트
   - 빌드 검증

2. **배포 단계** (main 브랜치만)
   - Vercel 자동 배포
   - 환경: Production

## 성능 최적화

### 번들 크기 최적화

**최적화 전:**
- 총 번들 크기: 310.78 KiB
- HashGenerator: 75.16KB (crypto-js 포함)

**최적화 후:**
- 총 번들 크기: 244.42 KiB (-21%)
- HashGenerator: 7.85KB (-90%)

**적용된 최적화:**
1. **네이티브 MD5 구현**: crypto-js 제거로 75KB 절감
2. **코드 분할**: React.lazy()로 초기 번들 32% 감소
3. **Tree Shaking**: 사용하지 않는 코드 제거
4. **Minification**: Terser를 통한 코드 압축

### 로딩 성능

**목표:**
- First Contentful Paint (FCP): <1초
- Largest Contentful Paint (LCP): <1.5초
- Time to Interactive (TTI): <2초
- Total Blocking Time (TBT): <200ms

**적용된 기술:**
- Service Worker 프리캐싱
- 정적 에셋 1년 캐싱
- Gzip/Brotli 압축
- 모듈 프리로드

### Lighthouse 점수 목표

- **Performance**: 95-100
- **Accessibility**: 95-100
- **Best Practices**: 95-100
- **SEO**: 90-100
- **PWA**: 100

자세한 내용은 [LIGHTHOUSE_OPTIMIZATION.md](./LIGHTHOUSE_OPTIMIZATION.md)를 참조하세요.

## 브라우저 지원

### 데스크톱 브라우저
- Chrome 87+ (최근 2 버전)
- Firefox 78+ (최근 2 버전 + ESR)
- Safari 14+ (최근 2 버전)
- Edge 88+ (최근 2 버전)

### 모바일 브라우저
- iOS Safari 14+
- Android Chrome 87+

### 사용된 브라우저 기능

**Modern JavaScript (ES2020):**
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Dynamic imports
- Async/await

**Web APIs:**
- Web Crypto API (SHA-256, SHA-512)
- Service Workers (PWA)
- LocalStorage (상태 저장)
- Clipboard API (복사 기능)

**CSS 기능:**
- CSS Grid
- CSS Flexbox
- CSS Custom Properties (테마 변수)
- CSS Transitions

자세한 내용은 [BROWSER_SUPPORT.md](./BROWSER_SUPPORT.md)를 참조하세요.

## 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork 저장소
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 개발 가이드라인

- TypeScript strict mode 준수
- 모든 새 기능에 테스트 작성
- ESLint 규칙 따르기
- 커밋 메시지는 명확하게
- PR에 변경사항 설명 포함

## 문제 해결

### PWA 설치가 작동하지 않음

**증상:** 설치 버튼이 표시되지 않음

**해결방법:**
1. HTTPS 연결 확인 (localhost는 예외)
2. Service Worker 등록 확인 (DevTools > Application > Service Workers)
3. Manifest 파일 확인 (DevTools > Application > Manifest)
4. 브라우저 캐시 삭제 후 재시도

### 다크 모드가 저장되지 않음

**증상:** 페이지 새로고침 시 다크 모드 설정이 초기화됨

**해결방법:**
1. 브라우저 LocalStorage 확인 (DevTools > Application > Local Storage)
2. 프라이빗 모드가 아닌지 확인
3. 브라우저 설정에서 쿠키/스토리지 허용 확인

### 빌드 실패

**증상:** `npm run build` 명령 실패

**해결방법:**
1. Node.js 버전 확인 (20.x 이상 필요)
2. 의존성 재설치: `rm -rf node_modules package-lock.json && npm install`
3. 타입 체크: `npm run type-check`
4. 린트 체크: `npm run lint`

### 테스트 실패

**증상:** 테스트 실행 시 오류 발생

**해결방법:**
1. 의존성 확인: `npm install`
2. 캐시 삭제: `npm run test -- --clearCache`
3. 특정 테스트만 실행: `npm run test -- ToolName`

### 성능 문제

**증상:** 앱이 느리게 로드됨

**해결방법:**
1. 네트워크 탭에서 번들 크기 확인 (DevTools > Network)
2. Lighthouse 감사 실행 (DevTools > Lighthouse)
3. Service Worker 캐시 확인
4. 브라우저 확장 프로그램 비활성화 후 테스트

## 에러 모니터링 (Sentry)

### 개요

프로덕션 환경에서 오류를 실시간으로 추적하고 모니터링하기 위해 Sentry를 통합했습니다.

### 주요 기능

✅ **자동 오류 포착**: JavaScript 오류와 React 컴포넌트 에러 자동 캡처
✅ **사용자 행동 추적**: 네비게이션, 클릭, API 호출, 변환 작업 등의 브레드크럼 기록
✅ **개인정보 보호**: 민감한 데이터 자동 필터링 (토큰, 비밀번호, PII 등)
✅ **상세한 컨텍스트**: 디바이스 정보, 성능 메트릭, 사용자 여정 포함
✅ **도구별 태깅**: 각 도구와 기능 영역별로 오류 분류

### 환경 설정

Sentry를 사용하려면 `.env` 파일에 다음 환경 변수를 추가하세요:

```bash
# Sentry 설정 (선택사항 - 프로덕션 에러 모니터링용)
VITE_SENTRY_DSN="https://...@...ingest.sentry.io/..."  # Sentry DSN
SENTRY_AUTH_TOKEN="sntrys_..."                         # 선택: 소스맵 업로드용 인증 토큰
SENTRY_ORG="your-org-slug"                             # 선택: Sentry 조직 슬러그
SENTRY_PROJECT="your-project-name"                     # 선택: Sentry 프로젝트 이름
```

#### Sentry 설정 값 얻기

1. **DSN (필수)**:
   - [Sentry](https://sentry.io)에 로그인
   - 프로젝트 선택 → Settings → Client Keys (DSN)
   - DSN 복사 (`https://` 형식)

2. **Auth Token (선택 - 소스맵용)**:
   - Settings → Auth Tokens → Create New Token
   - 권한: `project:releases` + `project:write`
   - 토큰 복사 (`sntrys_` 형식)

3. **Organization & Project (선택)**:
   - URL에서 확인: `sentry.io/organizations/{org}/projects/{project}/`

### Sentry 태그 구조

오류는 다음 태그로 자동 분류됩니다:

```javascript
// 도구별 태그
tool: "json-formatter" | "jwt-decoder" | "base64-converter" |
      "hash-generator" | "uuid-generator" | "url-encoder" |
      "timestamp-converter" | "api-tester"

tool.category: "formatter" | "decoder" | "converter" |
               "generator" | "encoder" | "tester"

// 기능 영역 태그
feature: "json-formatting" | "jwt-decoding" | "data-conversion" |
         "hash-generation" | "uuid-generation" | "url-encoding" |
         "timestamp-conversion" | "api-testing"

// 환경 정보
environment: "development" | "production"
app.version: "0.0.0"
```

### 추적되는 사용자 행동

#### 1. 네비게이션 (자동)
- 도구 간 이동
- 라우트 변경
- 사용자 여정

#### 2. 인터랙션 (수동)
- 버튼 클릭
- 복사 작업
- 도구 사용

#### 3. API 호출 (수동)
- 요청 메서드와 URL
- 응답 상태 코드
- 소요 시간

#### 4. 변환 작업 (수동)
- 인코딩/디코딩 성공/실패
- 입력/출력 크기
- 작업 타입

#### 5. 에러 (자동)
- 오류 메시지
- 스택 트레이스
- 컨텍스트 정보

### 개인정보 보호

다음 민감한 데이터는 자동으로 필터링됩니다:

- 🔒 Bearer 토큰 및 API 키
- 🔒 비밀번호 및 시크릿
- 🔒 이메일 주소
- 🔒 신용카드 번호
- 🔒 JWT 토큰
- 🔒 IP 주소

### 개발 환경 테스트

개발 환경에서 Sentry를 테스트하려면:

1. `.env` 파일에 `VITE_SENTRY_DSN` 설정
2. 개발 서버 시작: `npm run dev`
3. 우측 하단의 빨간색 에러 버튼 클릭
4. 브라우저 콘솔에서 Sentry 전송 로그 확인

### 상세 문서

더 자세한 정보는 다음 문서를 참조하세요:

- `docs/sentry-context-usage.md` - 사용 가이드 및 예제
- `docs/sentry-integration-test.md` - 통합 테스트 결과
- `docs/sentry-production-validation.md` - 프로덕션 검증
- `docs/sentry-acceptance-criteria.md` - 검수 기준

### 성능 영향

- **번들 크기**: +40-50KB gzipped (전체의 ~8%)
- **런타임 오버헤드**: 무시할 수 있는 수준
- **에러 전송 시간**: 평균 <500ms
- **비차단 작업**: 사용자 경험에 영향 없음

## 라이선스

MIT License - 자유롭게 사용하세요!

## 문의

문제가 있거나 질문이 있으시면 [GitHub Issues](https://github.com/yourusername/dev-utils-hub/issues)에 등록해주세요.

---

**Dev Utils Hub** - 개발자를 위한 필수 도구 모음 ⚡

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Tauri 2 데스크톱 앱(macOS · Windows · Linux)과 설치형 오프라인 PWA로 함께 배포된다.
**네이티브 iOS/Android 앱은 없다** — 모바일 접근은 반응형 PWA 경로뿐이다. 그래서 디자인
언어의 기준은 `web`이며, iOS/Android HIG 기준으로 판정하지 않는다.

⚠️ **Electron 이 아니다.** v1.0.0 에서 Electron → Tauri 2(Rust) 로 이전했고
`CLAUDE.md`가 "Tauri, not Electron — verified 2026-04-29"로 못박아 두었다.
`docs/DEPLOYMENT_GUIDE.md`는 아직 electron-builder 를 설명하는 **낡은 문서**이니
현재 사실로 쓰지 않는다.

## Users

주 사용자는 **개발자 본인**이다(개인 프로젝트, Tauri 식별자 `kr.jell.dev-utils-hub`).
하는 일은 일상적인 개발 잡무다 — JWT 하나 까보기, JSON 정렬하기, 문자열 두 개 비교하기,
해시 만들기, 타임스탬프 변환하기.

**결정적인 상황 근거는 `Korean DPI Tester`다.** 이 도구는 한국 ISP 의 DPI/TLS 핑거프린트 차단을
진단하려고 같은 URL 을 브라우저 fetch · 네이티브 rustls · curl 세 경로로 찔러 결과를 대조한다.
이건 범용 "개발자 도구 모음"에는 없는 한국 특화 도메인 로직이고, **실제로 그 문제를 겪은
사람이 만든 것**이라는 뜻이다.

읽어낼 수 있는 두 번째 동기: 민감한 값(JWT · 해시 · API 페이로드)을 **아무 웹사이트에 붙여넣지
않고** 처리하려는 것. 도구 로직 전부가 로컬에서 돈다.

## Product Purpose

개발자 유틸리티 20종을 창 하나에 모아, 20개의 웹사이트를 오가지 않고 로컬에서 처리하게 한다.
성공은 사용자가 "그 사이트 뭐였지"를 검색하지 않고, 값을 외부로 보내지 않고 일을 끝내는 것이다.

## Positioning

경쟁 상대는 다른 데스크톱 앱이 아니라 **검색해서 쓰는 일회용 웹 도구 사이트들**이다.
그것들이 못 하는 것:

- **네이티브 OS 통합** — 클립보드, 전역 단축키, 자동 시작, 네이티브 파일/다이얼로그,
  자동 업데이터, 시스템 로그(Tauri 플러그인)
- **완전 오프라인** — 설치형 PWA + 데스크톱 앱 양쪽 다 네트워크 없이 동작
- **AI 도 로컬로 돌 수 있다** — AI 도구 3종이 OpenAI · Gemini 뿐 아니라 **Ollama(로컬)** 를
  프로바이더로 지원한다. API 키는 Zustand persist 로 로컬에만 저장된다. 클라우드 전용인
  일반 도구 사이트의 AI 기능과 갈리는 지점이다.
- **도구 간 연결** — 한 도구의 출력을 다른 도구로 넘기는 흐름(Base64/JWT/Hash → API Tester)

⚠️ **프라이버시는 아직 "주장"이 아니라 "구조"다.** 도구 로직이 전부 클라이언트에서 돌고 백엔드가
없다는 것은 코드로 확인되지만, 이걸 마케팅 문구로 내건 적은 없다. 내걸기로 한다면 그건 새 결정이다.

## Operating Context

작업 중에 잠깐 끼어드는 도구다. 사용자는 이미 다른 일(코딩·디버깅)을 하던 중이고, 값 하나를
변환하려고 이 앱을 띄운다. 그래서 **홈에서 도구까지 가는 경로가 짧아야 하고**, 도구 화면은
들어오자마자 입력할 수 있어야 한다.

두 가지 실행 형태가 공존한다 — 네이티브 창(`npm run dev` → `tauri dev`)과 브라우저 PWA.
같은 UI 가 양쪽에서 말이 돼야 한다.

## Capabilities and Constraints

### 실제로 도달 가능한 도구 20종

⚠️ **문서마다 개수가 다르다. 정본은 `src/renderer/router.tsx` + `src/lib/plugins/builtin-plugins.ts`
이며, 그 기준이 20종이다.** (`CLAUDE.md`는 "13+", README/CHANGELOG 는 "19"로 낡았다.
홈 화면 `ToolGrid`가 플러그인 레지스트리를 직접 렌더링하므로 레지스트리가 곧 진실이다.)

JSON Formatter · JWT Debugger · Base64 Converter · URL Encoder · Regex Tester · Text Diff ·
Hash Generator(MD5/SHA-256/SHA-512 + HMAC) · UUID Generator · Timestamp Converter ·
Color Picker · Cron Parser · Cron Builder · **Korean DPI Tester** · Markdown Preview ·
CSS Unit Converter · AI Regex Builder · AI JSON Schema Generator · AI Code Explainer ·
WebCrypto/WASM Benchmark · Diff Viewer

여기에 도구가 아닌 앱 셸 화면으로 **Plugin Manager**(`/plugins`, 도구 켜고 끄기)가 있다.

### 만들어졌으나 도달 불가 — 기능으로 취급하지 않는다

- **API Tester** (`src/renderer/components/tools/APITester/`): 전용 문서(`docs/API-TESTER.md`)와
  테스트까지 있으나 **라우터에도 플러그인 레지스트리에도 등록돼 있지 않다.**
  더 나쁜 것은 Base64Converter · JwtDecoder · HashGenerator 에 있는 "Send to API Tester" 버튼이
  `navigate('/api-tester')`를 호출하는데 **그 라우트가 없어 홈으로 리다이렉트된다** — 실제로
  깨진 경로다. 문서 오류가 아니라 버그다.
- **Sentry Toolkit**: README 도구 표와 CHANGELOG v1.0.0 에 있으나 마찬가지로 미등록·미라우팅.

### 제약

- **AI 도구 3종은 키 없이는 동작하지 않는다** — 사용자가 API 키를 넣거나 Ollama 를 띄워야 한다.
  즉 첫 실행에서 이 셋은 빈손이다(빈 상태 설계가 필요한 자리).
- **라우팅이 해시 기반이다**(`createHashRouter`) — 데스크톱/PWA 양립 때문.
- **구조적 특이점**: `src/*` 와 `src/renderer/*` 가 거의 통째로 중복돼 있다. 진입점
  `src/main.tsx` → `src/App.tsx` → `src/renderer/router.tsx` 이므로 **실제 동작하는 컴포넌트
  트리는 `src/renderer/` 쪽**이고, `src/renderer/App.tsx`는 사용되지 않는다. `renderer` 라는
  이름은 Electron 시절(main/renderer 프로세스)의 잔재다. 파일을 고칠 때 어느 트리인지 확인할 것.
- **미구현으로 명시된 로드맵**: 로컬 HTTP mock 서버 · QR 코드 생성/해독 · 비밀번호 강도 검사.
  출시된 것처럼 쓰지 않는다.

## Brand Commitments

**이름**: `Dev Utils Hub` (package.json `productName`, Tauri 창 제목, `<title>`).
PWA 짧은 제목은 `DevUtils`, 홈 화면 표기는 `Developer Utils`.

**색** (`src/index.css` + `tailwind.config.js`, shadcn/ui 토큰 규약):
- Primary — 블루 `hsl(199 89% 48%)` (라이트/다크 동일)
- Secondary — 퍼플 `hsl(262 52% 47%)`
- Accent — 오렌지 `hsl(25 95% 53%)`
- PWA theme-color `#3b82f6`
- 라이트/다크 양쪽 지원(`darkMode: 'class'` + `next-themes`), 카드/배경/muted 는 다크에서
  별도 값, primary/secondary/accent 색상(hue)은 테마 간 유지

**아이콘**: `public/pwa-icon.svg` — 둥근 사각형 블루(`#3b82f6`) 바탕에 흰 볼드 `DU` 모노그램.
데스크톱 아이콘은 같은 소스에서 생성됨(`src-tauri/icons/`).

**보이스**: 담백하고 기능적이며 마케팅 수사가 없다. 태그라인이 문자 그대로
"Essential utilities for developers". README 는 한국어 우선 + 영문 병기 구조 —
**한국어가 1차 보이스, 영어가 병기**다. UI 는 `react-i18next`로 ko/en 양쪽 제공.

**도메인**: Tauri 식별자 `kr.jell.dev-utils-hub`, GitHub `jellive/dev-utils-hub`.

⚠️ **정본 URL 이 두 개로 갈려 있다** — README 는 `jell-dev-util.vercel.app`,
`public/sitemap.xml`·`robots.txt` 는 `https://dev-utils.jell.kr`. **어느 쪽이 정본인지
확정되지 않았다.** 캐노니컬 URL 을 쓰는 작업 전에 정해야 한다.

## Evidence on Hand

**있는 것:**
- 실제 스크린샷 3종: `docs/screenshots/01_home_mobile.png` · `02_home_desktop.png` ·
  `03_json_formatter.png` (README 에 임베드됨)
- 실제 릴리스 이력 5건(`CHANGELOG.md`, v1.0.0 2026-04-17 ~ v1.0.4 2026-04-21). 겪은 CI 실패와
  수정까지 기록돼 있다(누락된 `tauri` npm 스크립트, Windows `icon.ico` 부재, macOS 공증 배선)
  — 희망사항이 아니라 실제 운영 이력이다.
- 배포: GitHub Releases 에 macOS DMG(서명·공증) · Windows NSIS · Linux AppImage/deb,
  git tag push 시 GitHub Actions 매트릭스 빌드
- 테스트 자산: Vitest 유닛 641개, `fast-check` 속성 기반 테스트, Playwright E2E + 시각 회귀
  (Chromium/Firefox/WebKit/Mobile Chrome/Mobile Safari), Stryker 뮤테이션 테스트,
  Storybook 8(도구 12종에 스토리 존재), Lighthouse CI, Sentry
- 공개 웹 존재의 흔적: `public/ads.txt` 에 실제 Google AdSense 퍼블리셔 라인,
  Search Console 검증 파일

**없는 것 — 지어내지 않는다:**
- 사용자 수 · 다운로드 수 · 설치 수 지표가 **하나도 없다**
- 후기 · 고객 · 가격 · 페르소나 문서 · 사용자 조사 자료 없음
- 네이티브 iOS/Android 앱 없음
- 배포 URL 이 현재 실제로 뜨는지는 이 조사에서 확인하지 않았다

## Product Principles

1. **홈에서 도구까지 한 번에.** 작업 중에 끼어드는 도구라 탐색 단계가 늘면 웹사이트를
   검색하는 것보다 느려진다 — 그 순간 이 앱의 존재 이유가 사라진다.
2. **값은 기계 밖으로 나가지 않는다.** 도구 로직은 로컬에서 돈다. 이걸 깨는 기능은
   기능이 아니라 방향 전환이다.
3. **20개가 하나처럼 보여야 한다.** 도구마다 다른 사람이 만든 것처럼 보이는 순간
   "모아둔 값어치"가 사라진다. 입력·출력·복사 동작은 도구 간에 같은 모양이어야 한다.
4. **닿지 않는 도구는 없는 도구다.** API Tester 처럼 만들어졌지만 라우팅되지 않은 것을
   도구 개수에 세지 않는다. 세는 순간 문서가 또 거짓말을 시작한다.
5. **한국어가 1차다.** 영문 병기는 하되, 한국어가 어색해지는 구조는 택하지 않는다.

## Accessibility & Inclusion

**정량 기준이 하나 있고, 그것만이 진짜 게이트다** (`lighthouserc.json`):

- **하드 게이트(`error`, 빌드 실패)**: Lighthouse `categories:accessibility` **최소 0.8**
- 개별 a11y 감사는 **경고(`warn`)일 뿐 차단하지 않는다**: `aria-required-children`,
  `button-name`, `color-contrast`, `label-content-name-mismatch`
- 성능 ≥0.85, best-practices ≥0.85 도 하드 게이트. SEO 는 경고만.

별도로 `npm run test:a11y`가 `jest-axe` + `@axe-core/react` 유닛 스위트를 돌린다
(`src/renderer/components/tools/__tests__/accessibility.test.tsx`).

⚠️ **WCAG 등급(A/AA/AAA)을 채택했다는 근거는 레포 어디에도 없다.** 유일한 정량 기준은
위 Lighthouse 0.8 이다. "AA 준수"라고 쓰지 않는다.

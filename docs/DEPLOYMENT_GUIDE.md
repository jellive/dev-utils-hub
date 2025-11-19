# Electron 앱 배포 가이드

## 📋 목차

1. [빌드 및 배포 개요](#빌드-및-배포-개요)
2. [플랫폼별 배포](#플랫폼별-배포)
3. [자동 업데이트 설정](#자동-업데이트-설정)
4. [앱 서명 및 공증](#앱-서명-및-공증)
5. [배포 체크리스트](#배포-체크리스트)

---

## 빌드 및 배포 개요

### 현재 설정 상태

프로젝트는 이미 `electron-builder`로 완벽하게 설정되어 있습니다:

```yaml
# electron-builder.yml
appId: com.devutils.hub
productName: Dev Utils Hub
directories:
  buildResources: build
  output: dist-release  # 빌드된 파일이 저장될 폴더
```

### 빌드 프로세스

Electron 앱 빌드는 2단계로 진행됩니다:

1. **코드 빌드** (`npm run build`)
   - TypeScript → JavaScript 변환
   - Main, Preload, Renderer 프로세스 빌드
   - 결과물: `dist-electron/`, `dist/`

2. **배포 패키지 생성** (`npm run dist`)
   - 실행 파일 생성
   - 인스톨러 생성
   - 결과물: `dist-release/`

---

## 플랫폼별 배포

### 1. macOS 배포

#### 빌드 명령어

```bash
# 전체 빌드 (코드 빌드 + 배포 패키지)
npm run build && npm run dist:mac

# 또는 한 번에
npm run build && npm run dist
```

#### 생성되는 파일

```
dist-release/
├── Dev Utils Hub-0.0.0-arm64.dmg          # Apple Silicon (M1/M2/M3)
├── Dev Utils Hub-0.0.0-x64.dmg            # Intel Mac
├── Dev Utils Hub-0.0.0-arm64-mac.zip      # Apple Silicon (압축 버전)
├── Dev Utils Hub-0.0.0-x64-mac.zip        # Intel Mac (압축 버전)
└── mac/
    └── Dev Utils Hub.app                   # 앱 번들
```

#### 배포 형식

- **DMG (권장)**: 드래그 앤 드롭 설치 방식
  - 사용자가 Applications 폴더로 드래그
  - Mac 앱스토어 외부 배포에 가장 일반적
  - 파일 크기: 약 80-120MB

- **ZIP**: 압축 파일
  - 압축 해제 후 사용
  - 업데이트 시 사용하기 좋음
  - 파일 크기: DMG보다 작음

#### Universal Binary (선택사항)

현재는 x64, arm64 별도 빌드이지만, Universal Binary로 변경 가능:

```yaml
# electron-builder.yml
mac:
  target:
    - target: dmg
      arch:
        - universal  # 하나의 파일로 두 아키텍처 지원
```

---

### 2. Windows 배포

#### 빌드 명령어

```bash
# Windows에서 또는 macOS/Linux에서 크로스 컴파일
npm run build && npm run dist:win
```

#### 생성되는 파일

```
dist-release/
├── Dev Utils Hub Setup 0.0.0.exe          # 64비트 인스톨러
├── Dev Utils Hub Setup 0.0.0-ia32.exe     # 32비트 인스톨러
└── win-unpacked/                          # 압축 해제된 앱
```

#### 배포 형식

- **NSIS Installer**: 표준 Windows 설치 프로그램
  - 설치 마법사 UI
  - 프로그램 추가/제거 등록
  - 시작 메뉴 바로가기 생성
  - 파일 크기: 약 90-140MB

#### 크로스 플랫폼 빌드 주의사항

macOS에서 Windows 앱을 빌드하려면 Wine 필요:

```bash
brew install wine-stable
```

---

### 3. Linux 배포

#### 빌드 명령어

```bash
npm run build && npm run dist:linux
```

#### 생성되는 파일

```
dist-release/
├── Dev Utils Hub-0.0.0.AppImage           # AppImage (권장)
└── dev-utils-hub_0.0.0_amd64.deb         # Debian/Ubuntu 패키지
```

#### 배포 형식

- **AppImage (권장)**:
  - 단일 실행 파일
  - 설치 불필요 (chmod +x 후 실행)
  - 모든 Linux 배포판에서 작동
  - 파일 크기: 약 100-150MB

- **DEB**:
  - Debian/Ubuntu 계열용
  - apt 패키지 관리자로 설치
  - 시스템 통합 (메뉴, 아이콘 등)

---

## 버전 관리

### package.json 버전 업데이트

배포 전에 버전을 업데이트하세요:

```json
{
  "version": "0.0.0"  // 0.1.0, 1.0.0 등으로 변경
}
```

### 시맨틱 버저닝

- **Major (1.0.0)**: 호환성 깨지는 변경
- **Minor (0.1.0)**: 기능 추가 (하위 호환)
- **Patch (0.0.1)**: 버그 수정

---

## 자동 업데이트 설정

### GitHub Releases 연동

electron-builder는 GitHub Releases를 통한 자동 업데이트를 지원합니다.

#### 1. GitHub Personal Access Token 생성

1. GitHub Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 클릭
3. `repo` 권한 선택
4. 토큰 생성 및 저장

#### 2. 환경 변수 설정

```bash
# macOS/Linux
export GH_TOKEN="your_github_token_here"

# Windows
set GH_TOKEN=your_github_token_here
```

#### 3. 배포 명령어

```bash
# 빌드 + GitHub Releases에 자동 업로드
npm run build && npm run dist -- --publish always
```

#### 4. 자동 업데이트 코드 (선택사항)

Main 프로세스에 추가:

```typescript
// src/main/index.ts
import { autoUpdater } from 'electron-updater'

app.whenReady().then(() => {
  // 앱 시작 시 업데이트 확인
  autoUpdater.checkForUpdatesAndNotify()

  // 30분마다 업데이트 확인
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 30 * 60 * 1000)
})

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '업데이트 사용 가능',
    message: '새로운 버전이 있습니다. 다운로드 중...'
  })
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '업데이트 준비 완료',
    message: '재시작하여 업데이트를 적용하시겠습니까?',
    buttons: ['재시작', '나중에']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall()
    }
  })
})
```

---

## 앱 서명 및 공증

### macOS Code Signing

#### 1. Apple Developer 계정 필요

- Apple Developer Program 가입 ($99/year)
- Developer ID Application 인증서 발급

#### 2. 인증서 설정

```bash
# Keychain Access에서 인증서 확인
security find-identity -v -p codesigning
```

#### 3. electron-builder 설정

```yaml
# electron-builder.yml
mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
```

#### 4. 공증 (Notarization)

```yaml
# electron-builder.yml
afterSign: build/notarize.js
```

`build/notarize.js` 생성:

```javascript
const { notarize } = require('electron-notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename

  return await notarize({
    appBundleId: 'com.devutils.hub',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  })
}
```

환경 변수 설정:

```bash
export APPLEID="your_apple_id@email.com"
export APPLEIDPASS="app-specific-password"
```

### Windows Code Signing

Windows 앱 서명을 위해서는 Code Signing Certificate 필요:

```yaml
# electron-builder.yml
win:
  certificateFile: path/to/cert.pfx
  certificatePassword: ${env.CERT_PASSWORD}
```

---

## 배포 체크리스트

### 배포 전 준비

- [ ] **버전 업데이트**: package.json의 version 필드 변경
- [ ] **빌드 테스트**: `npm run build` 성공 확인
- [ ] **타입 체크**: `npm run type-check` 통과 확인
- [ ] **테스트 실행**: 모든 테스트 통과 확인
- [ ] **변경사항 문서화**: CHANGELOG.md 작성
- [ ] **Git 커밋**: 모든 변경사항 커밋 및 푸시

### 빌드 실행

#### macOS 전용 배포

```bash
# 1. 코드 빌드
npm run build

# 2. macOS 배포 패키지 생성
npm run dist:mac

# 3. 생성된 파일 확인
ls -lh dist-release/*.dmg
```

#### 전 플랫폼 배포 (macOS에서)

```bash
# 1. 코드 빌드
npm run build

# 2. 모든 플랫폼 배포 패키지 생성
npm run dist

# 3. 생성된 파일 확인
ls -lh dist-release/
```

### 배포 후 확인

- [ ] **파일 크기 확인**: 적절한 크기인지 확인
- [ ] **설치 테스트**: 각 플랫폼에서 설치 테스트
- [ ] **실행 테스트**: 앱이 정상 실행되는지 확인
- [ ] **기능 테스트**: 주요 기능 동작 확인
- [ ] **업데이트 테스트**: 자동 업데이트 동작 확인 (설정 시)

---

## GitHub Releases를 통한 배포

### 1. GitHub Repository 설정

```yaml
# electron-builder.yml
publish:
  provider: github
  releaseType: release
```

### 2. 배포 명령어

```bash
# 빌드 + GitHub Releases 업로드
export GH_TOKEN="your_token"
npm run build && npm run dist -- --publish always
```

### 3. Release Notes 작성

GitHub Releases 페이지에서:
- 버전 태그 (v1.0.0)
- 릴리스 제목
- 변경사항 설명
- 다운로드 링크는 자동 생성됨

---

## CI/CD 자동화 (GitHub Actions)

`.github/workflows/release.yml` 생성:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci

      - run: npm run build

      - run: npm run dist
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}
          path: dist-release/*
```

### 태그 푸시로 자동 배포

```bash
# 버전 태그 생성
git tag v1.0.0

# 태그 푸시 → 자동 빌드 및 배포 시작
git push origin v1.0.0
```

---

## 파일 크기 최적화

### 1. 불필요한 파일 제외

```yaml
# electron-builder.yml
files:
  - dist-electron
  - dist
  - package.json
  - "!**/*.map"           # Source maps 제외
  - "!**/.DS_Store"       # macOS 메타데이터 제외
  - "!**/node_modules/**" # node_modules 제외 (필요한 것만 포함)
```

### 2. ASAR 압축

electron-builder는 기본적으로 ASAR 압축 사용:

```yaml
# electron-builder.yml
asar: true  # 기본값
asarUnpack:
  - resources/**  # 압축하지 않을 파일
```

### 3. 번들 크기 분석

```bash
# Vite 번들 크기 분석
npm run build:web -- --analyze
```

---

## 배포 비용 및 고려사항

### 무료 옵션

1. **GitHub Releases**: 무료
   - 파일 크기 제한: 2GB per file
   - 저장 공간: 무제한 (public repo)

2. **Netlify/Vercel**: 웹 버전 호스팅 (무료 티어)

### 유료 옵션

1. **Apple Developer**: $99/year
   - macOS 앱 서명 및 공증
   - Mac App Store 배포

2. **Microsoft Store**: $19 (일회성)
   - Windows Store 배포

3. **CDN**: Cloudflare, AWS S3
   - 대용량 파일 배포 시 권장

---

## 배포 예제

### 전체 배포 프로세스 (macOS)

```bash
# 1. 버전 업데이트
# package.json: version "0.0.0" → "1.0.0"

# 2. 변경사항 커밋
git add .
git commit -m "chore: bump version to 1.0.0"
git push

# 3. 빌드 및 배포
npm run build
npm run dist:mac

# 4. 생성된 파일 확인
ls -lh dist-release/

# 출력 예시:
# Dev Utils Hub-1.0.0-arm64.dmg     (약 95MB)
# Dev Utils Hub-1.0.0-x64.dmg       (약 98MB)
# Dev Utils Hub-1.0.0-arm64-mac.zip (약 92MB)
# Dev Utils Hub-1.0.0-x64-mac.zip   (약 94MB)

# 5. GitHub Releases 생성 및 파일 업로드
# 또는 자동 업로드:
# export GH_TOKEN="your_token"
# npm run dist:mac -- --publish always
```

---

## 트러블슈팅

### 1. "Module not found" 에러

**원인**: node_modules가 제대로 포함되지 않음

**해결**:
```yaml
# electron-builder.yml
files:
  - dist-electron
  - dist
  - package.json
  - node_modules  # 명시적으로 포함
```

### 2. macOS "App is damaged" 경고

**원인**: 앱이 서명되지 않음

**해결**: Code signing 설정 또는 사용자에게 안내:
```bash
xattr -cr "/Applications/Dev Utils Hub.app"
```

### 3. Windows Defender 경고

**원인**: 서명되지 않은 앱

**해결**: Code signing certificate 구매 및 적용

### 4. macOS "cannot read entitlement data" 에러

**원인**: `build/entitlements.mac.plist` 파일이 누락됨

**증상**:
```
⨯ Command failed: codesign --sign ... --entitlements build/entitlements.mac.plist ...
build/entitlements.mac.plist: cannot read entitlement data
```

**해결**: `build/entitlements.mac.plist` 파일 생성
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.debugger</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
  </dict>
</plist>
```

### 5. "module is not defined in ES module scope" 에러

**원인**: `package.json`에 `"type": "module"`이 설정되어 있어 `.js` 파일이 ES 모듈로 처리됨

**증상**:
```
⨯ Unable to `require` moduleName=/path/to/notarize.js
message=module is not defined in ES module scope
```

**해결**: CommonJS 파일은 `.cjs` 확장자 사용
```bash
# notarize.js를 notarize.cjs로 변경
mv build/notarize.js build/notarize.cjs
```

그리고 `electron-builder.yml` 수정:
```yaml
afterSign: build/notarize.cjs  # .js → .cjs
```

### 6. Linux "Permission denied"

**원인**: AppImage 실행 권한 없음

**해결**:
```bash
chmod +x "Dev Utils Hub-1.0.0.AppImage"
```

---

## 배포 체크리스트 요약

### 릴리스 전
- [ ] 버전 번호 업데이트
- [ ] CHANGELOG.md 작성
- [ ] 모든 테스트 통과
- [ ] 빌드 성공 확인

### 빌드
- [ ] `npm run build` 실행
- [ ] `npm run dist:mac` 또는 `npm run dist` 실행
- [ ] dist-release/ 폴더 확인

### 배포
- [ ] GitHub Release 생성
- [ ] 릴리스 노트 작성
- [ ] 배포 파일 업로드 (수동) 또는 자동 업로드
- [ ] 다운로드 링크 테스트

### 사후 확인
- [ ] 설치 테스트
- [ ] 실행 테스트
- [ ] 주요 기능 동작 확인
- [ ] 사용자 피드백 모니터링

---

## 참고 자료

- [electron-builder 공식 문서](https://www.electron.build/)
- [Electron 배포 가이드](https://www.electronjs.org/docs/latest/tutorial/application-distribution)
- [macOS Code Signing](https://developer.apple.com/support/code-signing/)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/code-signing-best-practices)

---

**마지막 업데이트**: 2025년 11월 19일

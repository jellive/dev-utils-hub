# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.4] - 2026-04-21

### Changed

- i18n consistency: replaced 19 hardcoded Korean UI strings with `t()` calls across `Base64Converter`, `HashGenerator`, `URLConverter`, and `JwtDecoder`. New keys grouped under `tools.{base64,hash,url,jwt}.history` and `tools.hash.hmac` namespaces.
- `CronParser` intentionally left as-is — its `describeCron()` helper produces side-by-side `{ en, ko }` output as a feature, not a missed translation.

### Added

- 19 i18n keys per locale (en + ko both at 469, fully synced).

## [1.0.3] - 2026-04-21

### Changed

- README rewritten for the actual Tauri stack (previously documented an Electron setup that no longer reflects the codebase). New architecture diagram, tech stack table, and script reference.
- i18n: `ko.json` synced with `en.json`. 55 missing keys added across the `colorPicker`, `cronParser`, `markdownPreview`, and `cssConverter` sections, plus stragglers in `uuid` and `common`.

### Added

- `CHANGELOG.md` tracking releases from v1.0.0 onward.

## [1.0.2] - 2026-04-21

### Added

- Windows `icon.ico` generated from `public/pwa-512x512.svg`, unblocking the Windows build step.
- First full cross-platform release published as a draft on GitHub Releases — macOS universal DMG (signed + notarized), Linux AppImage and `.deb`, Windows NSIS installer.

### Fixed

- Windows `tauri-build` failure: `icons/icon.ico not found; required for generating a Windows Resource file`.

## [1.0.1] - 2026-04-21

### Added

- macOS code signing + Apple notarization wired through `tauri-action` (Developer ID Application certificate, app-specific password, notary team ID).
- `KEYCHAIN_PASSWORD` env var in the release workflow so the signing keychain can be provisioned on GitHub-hosted macOS runners.

### Fixed

- CI build failure on all three matrix runners: `npm error Missing script: "tauri"`. Added `"tauri": "tauri"` to `package.json` scripts so `tauri-action` can invoke the CLI.
- `tauri-apps/tauri-action` pinned to `v0.5` (was floating on `v0`) to stabilize the supply chain.
- `includeUpdaterJson` disabled until a Tauri updater signing key is provisioned (prevents build from aborting on missing `createUpdaterArtifacts` config).

## [1.0.0] - 2026-04-17

### Added

- Initial release migrated from Electron to Tauri 2.10.
- 19 developer utility tools: JSON Formatter, JWT Decoder, Base64 Converter, Hash Generator (MD5 / SHA-256 / SHA-512 / HMAC), UUID Generator, URL Encoder/Decoder, Timestamp Converter, Regex Tester, Text Diff, Color Picker, Cron Parser, Markdown Preview, CSS Unit Converter, Diff Viewer, WASM Benchmark, Sentry Toolkit, and AI-powered tools (Code Explainer, JSON Schema Generator, Regex Builder).
- Korean + English i18n via `react-i18next`.
- Sentry error monitoring with breadcrumb tracking.
- GitHub Actions release workflow — Tauri matrix build across macOS universal, Ubuntu 22.04, and Windows latest.
- 641 Vitest unit tests plus Playwright E2E coverage.
- Tauri plugins wired: store, updater, dialog, fs, clipboard-manager, global-shortcut, log, opener, autostart.
- PWA support via `vite-plugin-pwa` for browser-mode offline use.

[Unreleased]: https://github.com/jellive/dev-utils-hub/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/jellive/dev-utils-hub/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/jellive/dev-utils-hub/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/jellive/dev-utils-hub/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/jellive/dev-utils-hub/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/jellive/dev-utils-hub/releases/tag/v1.0.0

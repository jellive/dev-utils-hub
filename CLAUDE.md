# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Dev Utils Hub** — Tauri 2 desktop app bundling 13+ developer utilities (Korean DPI Tester, JSON tools, etc).

## Tech Stack

- **Tauri 2** (Rust, `src-tauri/`) + **React** + **TypeScript** + **Vite**
- **Radix UI** primitives + Tailwind
- **Vitest** (unit + property + a11y), **Playwright** (e2e + visual), **Stryker** (mutation), **Lighthouse CI** (perf)

> **Tauri, not Electron** — verified 2026-04-29 via `pnpm tauri build` workflow.

## Commands

```bash
npm run dev:web              # browser dev (no Tauri shell)
npm run tauri dev            # Tauri desktop dev
npm run build                # web bundle
npm run tauri build          # desktop bundle (cross-compile)
npm test                     # vitest
npm run test:e2e             # playwright
npm run test:mutation        # stryker
npm run test:property        # property-based tests
npm run test:a11y            # accessibility tests
npm run lighthouse           # perf check
npm run type-check           # tsc --noEmit
```

## Source Layout

- `src/` — React app (TypeScript)
- `src-tauri/` — Rust backend (Tauri commands)
- `tests/` — unit + property + a11y + e2e

## Notes

- Heavy test layering: vitest → property → a11y → playwright e2e → visual → lighthouse perf
- Coverage maintained ~80%+ lines (2026-04 audit)
- Korean DPI Tester probes Node TLS / wget / Python clients to detect ISP DPI patterns

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

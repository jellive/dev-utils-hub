# Task 14: Initialize Sentry SDK in Application

**Status**: pending
**Priority**: high

**Dependencies**: 13

## Description

Set up Sentry initialization in main.tsx with production-only configuration, release versioning, and environment detection

## Details

Initialize Sentry.init() in main.tsx with DSN from environment, enable only in production (import.meta.env.PROD), configure release version, tracesSampleRate, and environment. Add beforeSend hook stub for data filtering.

## Test Strategy

Test initialization only runs in production build, verify Sentry dashboard receives test error, check release and environment tags

## Subtasks

### 14.1 - Create Sentry configuration module

**Status**: pending

Create src/config/sentry.ts with type-safe Sentry configuration

**Details**: Create configuration module with proper TypeScript types, environment variable validation, and export sentryConfig object

### 14.2 - Implement Sentry.init in main.tsx

**Status**: pending

Add Sentry initialization logic to main.tsx with production guard

**Details**: Import Sentry and config, add if (import.meta.env.PROD) check, initialize with DSN, release, environment, and tracesSampleRate

### 14.3 - Set up release versioning system

**Status**: pending

Configure automatic release version generation from package.json

**Details**: Use package.json version for release tag, create vite plugin or build script to inject __APP_VERSION__, configure release format

### 14.4 - Test Sentry initialization

**Status**: pending

Verify Sentry initializes correctly in production build

**Details**: Build production bundle, test initialization logs, verify Sentry dashboard connection, check release and environment tags


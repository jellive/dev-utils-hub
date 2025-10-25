# Task 16: Configure Source Map Generation and Upload

**Status**: pending
**Priority**: high

**Dependencies**: 14

## Description

Set up build process to generate source maps, configure automatic upload to Sentry for proper error stack trace resolution

## Details

Update vite.config.ts to generate source maps in production build. Configure @sentry/cli with auth token and org/project. Add release creation and source map upload to build script. Set up proper release versioning and finalization.

## Test Strategy

Build production bundle with source maps, verify source maps uploaded to Sentry, test error in production shows original source code locations

## Subtasks

### 16.1 - Configure source map generation in Vite

**Status**: pending

Update vite.config.ts to generate source maps for production

**Details**: Set build.sourcemap to true or "hidden", configure source map options, test source map generation

### 16.2 - Set up Sentry CLI configuration

**Status**: pending

Configure .sentryclirc with auth token and project details

**Details**: Create .sentryclirc with org, project, auth token from env, add to .gitignore, document setup

### 16.3 - Create release and upload script

**Status**: pending

Add build script for Sentry release creation and source map upload

**Details**: Create scripts/sentry-release.sh, implement release creation, source map upload, release finalization, integrate with package.json build

### 16.4 - Test source map resolution

**Status**: pending

Verify error stack traces resolve to original source code

**Details**: Trigger production error, check Sentry dashboard, verify file names and line numbers match original source


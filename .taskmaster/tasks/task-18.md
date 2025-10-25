# Task 18: Add Custom Error Context and Breadcrumbs

**Status**: pending
**Priority**: medium

**Dependencies**: 14

## Description

Enhance error reports with custom tags (tool, feature, user_type), breadcrumbs for user actions, and performance data

## Details

Configure custom tags for error categorization (current tool, feature area, user type). Set up breadcrumb tracking for user navigation and actions. Add custom context (browser info, OS, screen size, performance metrics). Integrate with React Router for navigation tracking.

## Test Strategy

Trigger errors in different tools, verify custom tags present, check breadcrumbs show user journey, validate performance data captured

## Subtasks

### 18.1 - Configure custom tags

**Status**: pending

Set up tags for tool, feature, and user type categorization

**Details**: Add Sentry.setTag() calls for current tool, feature area, user type, configure dynamic tag updates

### 18.2 - Implement breadcrumb tracking

**Status**: pending

Set up breadcrumbs for user navigation and actions

**Details**: Integrate with React Router, track navigation, user clicks, form submissions, API calls

### 18.3 - Add custom context data

**Status**: pending

Enhance errors with browser, OS, screen size, and performance data

**Details**: Use Sentry.setContext() for device info, browser capabilities, screen dimensions, performance metrics

### 18.4 - Test context enrichment

**Status**: pending

Verify custom tags and context appear in error reports

**Details**: Trigger errors in different scenarios, verify tags, breadcrumbs, and context data in Sentry dashboard


# Sentry Setup Guide

This guide explains how to set up and test Sentry error monitoring with source map support.

## Prerequisites

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for this application
3. Obtain the following from Sentry dashboard:
   - **DSN**: Project Settings → Client Keys (DSN)
   - **Auth Token**: Settings → Account → API → Auth Tokens (Create new token with `project:releases` and `org:read` scopes)
   - **Org Slug**: Organization Settings → General Settings
   - **Project Name**: Project Settings → General Settings

## Environment Setup

Create a `.env` file in the project root with the following variables:

```bash
# Sentry Configuration
VITE_SENTRY_DSN="https://[key]@[organization].ingest.sentry.io/[project-id]"
SENTRY_AUTH_TOKEN="sntrys_[your_token_here]"
SENTRY_ORG="your-organization-slug"
SENTRY_PROJECT="your-project-name"
```

## Build and Deploy

### Production Build

```bash
# Build with source maps and upload to Sentry
NODE_ENV=production npm run build
```

The build process will:
1. Generate source maps for all JavaScript files
2. Create a Sentry release with version from `package.json`
3. Upload source maps to Sentry
4. Associate the release with git commits (if available)

### Verify Source Map Upload

After building, check the Sentry dashboard:
1. Go to **Releases** → Find your release (e.g., `dev-utils-hub@0.0.0`)
2. Click on the release
3. Navigate to **Artifacts** tab
4. Verify source maps are listed (files ending with `.js.map`)

## Testing Error Tracking

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the application in your browser
3. Click the **"Trigger Error (Dev Only)"** button in the bottom-right corner
4. The ErrorBoundary fallback UI should appear
5. Check Sentry dashboard for the error (may take a few seconds)

### Production Mode

1. Build and serve the production build:
   ```bash
   NODE_ENV=production npm run build
   npm run preview
   ```

2. Trigger an error in the application
3. Check Sentry dashboard

### Verify Source Map Resolution

When viewing an error in Sentry:

1. Click on the error to view details
2. Navigate to the **Stack Trace** tab
3. Verify that:
   - ✅ File names show original source files (e.g., `ErrorTrigger.tsx`)
   - ✅ Line numbers match original source code
   - ✅ Code context shows actual TypeScript/JSX code
   - ❌ No minified or bundled file names (e.g., `index-abc123.js`)

## Features

### Implemented Features

- ✅ Sentry SDK initialization with environment-based configuration
- ✅ ErrorBoundary with user-friendly fallback UI
- ✅ Error recovery mechanisms (reload, go home)
- ✅ Source map generation and automatic upload
- ✅ Release versioning tied to `package.json`
- ✅ Git commit association (when available)
- ✅ Development-only error trigger button
- ✅ Production-only error tracking (disabled in development)

### Error Boundary Features

- User-friendly error UI with icon and message
- Action buttons:
  - **Reload Page**: Resets error and reloads
  - **Go to Home**: Navigates to home page
- Stack trace visibility (development mode only)
- Sentry user feedback dialog (production mode)

### Privacy & Security (To be implemented in Task 17)

- Data filtering for sensitive information
- Custom beforeSend hook
- Breadcrumb filtering
- User context configuration

## Troubleshooting

### Source Maps Not Uploading

1. Verify `SENTRY_AUTH_TOKEN` has correct permissions
2. Check `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry setup
3. Ensure `NODE_ENV=production` is set during build
4. Check build logs for Sentry plugin output

### Errors Not Appearing in Sentry

1. Verify `VITE_SENTRY_DSN` is set correctly
2. Check browser console for Sentry initialization errors
3. Ensure error occurs in production mode (Sentry is disabled in development)
4. Check Sentry project settings for rate limiting

### Source Maps Not Resolving

1. Verify source maps were uploaded (check Releases → Artifacts)
2. Ensure release name matches between SDK and uploaded artifacts
3. Check that `sourcemap: true` is set in `vite.config.ts`
4. Verify build output directory matches plugin configuration

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Vite Plugin Documentation](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/)
- [Source Maps Documentation](https://docs.sentry.io/platforms/javascript/sourcemaps/)

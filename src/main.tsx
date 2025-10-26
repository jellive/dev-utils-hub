import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.tsx';
import { getSentryConfig } from './config/sentry';
import { ErrorFallback } from './components/ErrorFallback';
import { initializeSentryContext } from './utils/sentryContext';

// Initialize Sentry for production error monitoring
const sentryConfig = getSentryConfig();
if (sentryConfig.enabled && sentryConfig.dsn) {
  Sentry.init(sentryConfig);

  // Initialize Sentry context with device, browser, and performance data
  initializeSentryContext();
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error as Error} resetError={resetError} />
      )}
      showDialog
      dialogOptions={{
        title: 'It looks like we\'re having issues.',
        subtitle: 'Our team has been notified.',
        subtitle2: 'If you\'d like to help, tell us what happened below.',
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);

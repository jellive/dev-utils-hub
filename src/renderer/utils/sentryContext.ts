/**
 * Sentry Context Management Utilities
 * Provides functions to enrich error reports with custom tags, breadcrumbs, and context data
 */

import * as Sentry from '@sentry/react';

/** Chrome-only memory info (non-standard) */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/** Network Information API (non-standard) */
interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

/**
 * Tool names that match the router paths
 */
export const TOOLS = {
  HOME: 'home',
  JSON_FORMATTER: 'json',
  JWT_DECODER: 'jwt',
  BASE64_CONVERTER: 'base64',
  URL_CONVERTER: 'url',
  REGEX_TESTER: 'regex',
  TEXT_DIFF: 'diff',
  HASH_GENERATOR: 'hash',
  UUID_GENERATOR: 'uuid',
  TIMESTAMP_CONVERTER: 'timestamp',
} as const;

export type Tool = (typeof TOOLS)[keyof typeof TOOLS];

/**
 * Feature areas within the application
 */
export const FEATURES = {
  NAVIGATION: 'navigation',
  TOOL_USAGE: 'tool-usage',
  DATA_CONVERSION: 'data-conversion',
  TEXT_PROCESSING: 'text-processing',
  VALIDATION: 'validation',
  HISTORY: 'history',
  SETTINGS: 'settings',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * User interaction types for breadcrumb categorization
 */
export const INTERACTION_TYPES = {
  CLICK: 'click',
  INPUT: 'input',
  NAVIGATION: 'navigation',
  API_CALL: 'api-call',
  CONVERSION: 'conversion',
  COPY: 'copy',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  ERROR: 'error',
} as const;

export type InteractionType = (typeof INTERACTION_TYPES)[keyof typeof INTERACTION_TYPES];

/**
 * Set the current tool being used
 * Updates Sentry tag for better error categorization
 */
export function setCurrentTool(tool: Tool): void {
  if (!Sentry.isInitialized()) return;

  Sentry.setTag('tool', tool);
  Sentry.setTag('tool.category', getToolCategory(tool));
}

/**
 * Set the current feature area
 * Helps identify which part of the application had an error
 */
export function setCurrentFeature(feature: Feature): void {
  if (!Sentry.isInitialized()) return;

  Sentry.setTag('feature', feature);
}

/**
 * Get tool category for grouping similar tools
 */
function getToolCategory(tool: Tool): string {
  const categories: Record<Tool, string> = {
    [TOOLS.HOME]: 'navigation',
    [TOOLS.JSON_FORMATTER]: 'formatter',
    [TOOLS.JWT_DECODER]: 'decoder',
    [TOOLS.BASE64_CONVERTER]: 'converter',
    [TOOLS.URL_CONVERTER]: 'converter',
    [TOOLS.REGEX_TESTER]: 'tester',
    [TOOLS.TEXT_DIFF]: 'comparator',
    [TOOLS.HASH_GENERATOR]: 'generator',
    [TOOLS.UUID_GENERATOR]: 'generator',
    [TOOLS.TIMESTAMP_CONVERTER]: 'converter',
  };

  return categories[tool] || 'unknown';
}

/**
 * Add a breadcrumb for user navigation
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  if (!Sentry.isInitialized()) return;

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated from ${from} to ${to}`,
    level: 'info',
    data: {
      from,
      to,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Add a breadcrumb for user interactions
 */
export function addInteractionBreadcrumb(
  type: InteractionType,
  target: string,
  details?: Record<string, unknown>
): void {
  if (!Sentry.isInitialized()) return;

  Sentry.addBreadcrumb({
    category: 'user-interaction',
    message: `User ${type}: ${target}`,
    level: 'info',
    data: {
      type,
      target,
      ...details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Add a breadcrumb for API calls
 */
export function addAPIBreadcrumb(
  method: string,
  url: string,
  statusCode?: number,
  duration?: number
): void {
  if (!Sentry.isInitialized()) return;

  Sentry.addBreadcrumb({
    category: 'http',
    message: `${method} ${url}`,
    level: statusCode && statusCode >= 400 ? 'error' : 'info',
    data: {
      method,
      url,
      status_code: statusCode,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Add a breadcrumb for conversion operations
 */
export function addConversionBreadcrumb(
  tool: Tool,
  inputSize: number,
  outputSize: number,
  success: boolean
): void {
  if (!Sentry.isInitialized()) return;

  Sentry.addBreadcrumb({
    category: 'conversion',
    message: `${tool} conversion ${success ? 'successful' : 'failed'}`,
    level: success ? 'info' : 'warning',
    data: {
      tool,
      input_size: inputSize,
      output_size: outputSize,
      success,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Add a breadcrumb for error events
 */
export function addErrorBreadcrumb(
  errorType: string,
  errorMessage: string,
  context?: string
): void {
  if (!Sentry.isInitialized()) return;

  Sentry.addBreadcrumb({
    category: 'error',
    message: `Error: ${errorType}`,
    level: 'error',
    data: {
      error_type: errorType,
      error_message: errorMessage,
      context,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Set device and browser context
 * Captures comprehensive browser and device information
 */
export function setDeviceContext(): void {
  if (!Sentry.isInitialized()) return;

  const context = {
    browser: {
      name: getBrowserName(),
      version: getBrowserVersion(),
      language: navigator.language,
      languages: navigator.languages,
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      userAgent: navigator.userAgent,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },
    device: {
      isMobile: isMobileDevice(),
      isTablet: isTabletDevice(),
      isDesktop: isDesktopDevice(),
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
    },
    connection: getConnectionInfo(),
    memory: getMemoryInfo(),
    platform: {
      os: getOSName(),
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
    },
  };

  Sentry.setContext('device', context);
}

/**
 * Set performance context
 * Captures performance metrics and timing data
 */
export function setPerformanceContext(): void {
  if (!Sentry.isInitialized()) return;

  if ('performance' in window && performance.timing) {
    const timing = performance.timing;
    const navigation = performance.navigation;

    const perfData = {
      timing: {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom_processing: timing.domComplete - timing.domLoading,
        dom_interactive: timing.domInteractive - timing.navigationStart,
        dom_content_loaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        load_complete: timing.loadEventEnd - timing.navigationStart,
        total: timing.loadEventEnd - timing.fetchStart,
      },
      navigation: {
        type: getNavigationType(navigation.type),
        redirectCount: navigation.redirectCount,
      },
      memory: (performance as unknown as { memory?: PerformanceMemory }).memory
        ? {
            used: (performance as unknown as { memory: PerformanceMemory }).memory.usedJSHeapSize,
            total: (performance as unknown as { memory: PerformanceMemory }).memory.totalJSHeapSize,
            limit: (performance as unknown as { memory: PerformanceMemory }).memory.jsHeapSizeLimit,
          }
        : undefined,
    };

    Sentry.setContext('performance', perfData);
  }

  // Also capture current performance metrics
  if (performance.getEntriesByType) {
    const paintEntries = performance.getEntriesByType('paint');
    const navigationEntries = performance.getEntriesByType('navigation');

    if (paintEntries.length > 0 || navigationEntries.length > 0) {
      Sentry.setContext('web-vitals', {
        fcp: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || null,
        paint_entries: paintEntries.length,
        navigation_entries: navigationEntries.length,
      });
    }
  }
}

/**
 * Helper: Get browser name from user agent
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Unknown';
}

/**
 * Helper: Get browser version
 */
function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  const match =
    ua.match(/(?:Firefox|Edg|Chrome|Safari|Opera|OPR)\/(\d+\.\d+)/) ||
    ua.match(/Version\/(\d+\.\d+)/);
  return match ? match[1] : 'Unknown';
}

/**
 * Helper: Get OS name from user agent
 */
function getOSName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

/**
 * Helper: Check if device is mobile
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Helper: Check if device is tablet
 */
function isTabletDevice(): boolean {
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
}

/**
 * Helper: Check if device is desktop
 */
function isDesktopDevice(): boolean {
  return !isMobileDevice() && !isTabletDevice();
}

/**
 * Helper: Get connection information
 */
function getConnectionInfo() {
  type NavigatorWithConnection = Navigator & {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  };
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

/**
 * Helper: Get memory information (Chrome only)
 */
function getMemoryInfo() {
  const memory = (performance as unknown as { memory?: PerformanceMemory }).memory;

  if (!memory) return null;

  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    usedPercent: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2),
  };
}

/**
 * Helper: Get navigation type as string
 */
function getNavigationType(type: number): string {
  const types = ['navigate', 'reload', 'back_forward', 'prerender'];
  return types[type] || 'unknown';
}

/**
 * Initialize all Sentry context on app startup
 * Should be called once when the application initializes
 */
export function initializeSentryContext(): void {
  if (!Sentry.isInitialized()) return;

  setDeviceContext();
  setPerformanceContext();

  // Set initial tags
  Sentry.setTag('environment', import.meta.env.MODE);
  Sentry.setTag('app.version', import.meta.env.VITE_APP_VERSION || '0.0.0');

  // Add initial breadcrumb
  Sentry.addBreadcrumb({
    category: 'app',
    message: 'Application initialized',
    level: 'info',
    data: {
      timestamp: new Date().toISOString(),
    },
  });
}

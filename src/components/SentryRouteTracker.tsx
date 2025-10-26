/**
 * Sentry Route Tracker Component
 * Automatically tracks route changes and updates Sentry context
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { setCurrentTool, addNavigationBreadcrumb, type Tool, TOOLS } from '../utils/sentryContext';

/**
 * Map route paths to tool names
 */
const ROUTE_TO_TOOL_MAP: Record<string, Tool> = {
  '/': TOOLS.HOME,
  '/json': TOOLS.JSON_FORMATTER,
  '/jwt': TOOLS.JWT_DECODER,
  '/base64': TOOLS.BASE64_CONVERTER,
  '/url': TOOLS.URL_CONVERTER,
  '/regex': TOOLS.REGEX_TESTER,
  '/diff': TOOLS.TEXT_DIFF,
  '/hash': TOOLS.HASH_GENERATOR,
  '/uuid': TOOLS.UUID_GENERATOR,
  '/timestamp': TOOLS.TIMESTAMP_CONVERTER,
  '/api-tester': TOOLS.API_TESTER,
};

/**
 * SentryRouteTracker Component
 *
 * Tracks route changes and updates Sentry context with:
 * - Current tool being used
 * - Navigation breadcrumbs
 * - Route transitions
 *
 * Usage:
 * ```tsx
 * <Router>
 *   <SentryRouteTracker />
 *   <Routes>...</Routes>
 * </Router>
 * ```
 */
export function SentryRouteTracker() {
  const location = useLocation();
  const previousLocation = useRef<string>('/');

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocation.current;

    // Update current tool tag
    const currentTool = ROUTE_TO_TOOL_MAP[currentPath] || TOOLS.HOME;
    setCurrentTool(currentTool);

    // Add navigation breadcrumb
    if (previousPath !== currentPath) {
      const fromTool = ROUTE_TO_TOOL_MAP[previousPath] || 'unknown';
      const toTool = ROUTE_TO_TOOL_MAP[currentPath] || 'unknown';

      addNavigationBreadcrumb(fromTool, toTool);
    }

    // Update previous location for next navigation
    previousLocation.current = currentPath;
  }, [location]);

  // This component doesn't render anything
  return null;
}

import type { RequestConfig, ResponseData } from '../types';

/**
 * Enhanced promise with cancellation support
 */
type CancellablePromise<T> = Promise<T> & { cancel?: () => void };

/**
 * Sends an HTTP request with timeout, cancellation, and auth support
 * @param config - Request configuration
 * @returns Promise that resolves to ResponseData with optional cancel method
 */
export function sendRequest(config: RequestConfig): CancellablePromise<ResponseData> {
  const controller = new AbortController();
  const startTime = performance.now();

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isTimedOut = false;
  let isCancelled = false;

  // Build URL with query parameters
  const url = buildUrlWithParams(config.url, config.queryParams, config.auth);

  // Build headers
  const headers = buildHeaders(config);

  // Set timeout
  timeoutId = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, config.timeout);

  const promise = fetch(url, {
    method: config.method,
    headers,
    body: config.body || undefined,
    signal: controller.signal,
  })
    .then(async (response) => {
      // Clear timeout on successful response
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const endTime = performance.now();
      const responseText = await response.text();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        time: endTime - startTime,
        size: new Blob([responseText]).size,
      };
    })
    .catch((error) => {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle different error types
      if (isTimedOut) {
        throw new Error('Request timeout');
      }
      if (isCancelled) {
        throw new Error('Request cancelled');
      }
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    });

  // Create a cancellable promise by attaching cancel method
  const cancellablePromise = promise as CancellablePromise<ResponseData>;
  cancellablePromise.cancel = () => {
    isCancelled = true;
    controller.abort();
  };

  return cancellablePromise;
}

/**
 * Builds URL with query parameters (includes API key if addTo is 'query')
 */
function buildUrlWithParams(baseUrl: string, queryParams: RequestConfig['queryParams'], auth: RequestConfig['auth']): string {
  const url = new URL(baseUrl);

  // Add enabled query params
  const enabledParams = queryParams.filter((p) => p.enabled);
  enabledParams.forEach((param) => {
    url.searchParams.append(param.key, param.value);
  });

  // Add API key to query if needed
  if (auth.type === 'apiKey' && auth.addTo === 'query') {
    url.searchParams.append(auth.key, auth.value);
  }

  return url.toString();
}

/**
 * Builds headers object with auth and custom headers
 */
function buildHeaders(config: RequestConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add enabled custom headers
  config.headers
    .filter((h) => h.enabled)
    .forEach((header) => {
      headers[header.key] = header.value;
    });

  // Add auth headers
  if (config.auth.type === 'bearer') {
    headers['Authorization'] = `Bearer ${config.auth.token}`;
  } else if (config.auth.type === 'basic') {
    const credentials = btoa(`${config.auth.username}:${config.auth.password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else if (config.auth.type === 'apiKey' && config.auth.addTo === 'header') {
    headers[config.auth.key] = config.auth.value;
  }

  return headers;
}

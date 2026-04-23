import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendRequest } from '../utils/httpClient';
import type { RequestConfig } from '../types';

/**
 * HTTP Client Tests
 *
 * Comprehensive tests for the HTTP client including:
 * - Request sending with various HTTP methods
 * - Authentication (Bearer, Basic, API Key in header/query)
 * - Query parameter handling
 * - Custom headers
 * - Timeout handling
 * - Request cancellation
 * - Error handling (network, timeout, abort)
 */

// Default request config for tests
const defaultConfig: Omit<RequestConfig, 'url' | 'method'> = {
  headers: [],
  queryParams: [],
  body: '',
  timeout: 30000,
  auth: { type: 'none' },
};

describe('httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('sendRequest - Basic functionality', () => {
    it('should send GET request successfully', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      // Advance timers to ensure timeout doesn't fire
      vi.runAllTimers();

      const result = await promise;

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.body).toBe('{"data": "test"}');
      expect(result.headers['Content-Type'] || result.headers['content-type']).toBe(
        'application/json'
      );
      expect(result.time).toBeGreaterThanOrEqual(0);
      expect(result.size).toBe(16);
    });

    it('should send POST request with body', async () => {
      const mockResponse = new Response('{"success": true}', {
        status: 201,
        statusText: 'Created',
      });

      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      const requestBody = JSON.stringify({ name: 'test' });
      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com/create',
        method: 'POST',
        body: requestBody,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/create',
        expect.objectContaining({
          method: 'POST',
          body: requestBody,
        })
      );
    });

    it('should measure response time accurately', async () => {
      const mockResponse = new Response('test', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      vi.runAllTimers();
      const result = await promise;

      expect(result.time).toBeGreaterThanOrEqual(0);
      expect(typeof result.time).toBe('number');
    });

    it('should calculate response size correctly', async () => {
      const responseBody = 'test response body';
      const mockResponse = new Response(responseBody, { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      vi.runAllTimers();
      const result = await promise;

      expect(result.size).toBe(responseBody.length);
    });
  });

  describe('sendRequest - Query parameters', () => {
    it('should add enabled query parameters to URL', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        queryParams: [
          { key: 'page', value: '1', enabled: true },
          { key: 'limit', value: '10', enabled: true },
          { key: 'disabled', value: 'skip', enabled: false },
        ],
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).not.toContain('disabled=skip');
    });

    it('should handle empty query parameters', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        queryParams: [],
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('https://api.example.com/');
    });
  });

  describe('sendRequest - Custom headers', () => {
    it('should add enabled custom headers', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        headers: [
          { key: 'X-Custom-Header', value: 'test-value', enabled: true },
          { key: 'X-Another-Header', value: 'another-value', enabled: true },
          { key: 'X-Disabled', value: 'skip', enabled: false },
        ],
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['X-Custom-Header']).toBe('test-value');
      expect(calledHeaders['X-Another-Header']).toBe('another-value');
      expect(calledHeaders['X-Disabled']).toBeUndefined();
    });

    it('should handle empty custom headers', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        headers: [],
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(Object.keys(calledHeaders)).toHaveLength(0);
    });
  });

  describe('sendRequest - Authentication', () => {
    it('should add Bearer token to headers', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        auth: { type: 'bearer', token: 'test-token-123' },
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['Authorization']).toBe('Bearer test-token-123');
    });

    it('should add Basic auth to headers', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        auth: { type: 'basic', username: 'user', password: 'pass' },
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      const expectedAuth = `Basic ${btoa('user:pass')}`;
      expect(calledHeaders['Authorization']).toBe(expectedAuth);
    });

    it('should add API key to headers when addTo is header', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        auth: { type: 'apiKey', key: 'X-API-Key', value: 'secret-key', addTo: 'header' },
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['X-API-Key']).toBe('secret-key');
    });

    it('should add API key to query params when addTo is query', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        auth: { type: 'apiKey', key: 'api_key', value: 'secret-123', addTo: 'query' },
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('api_key=secret-123');
    });

    it('should not add auth headers when auth type is none', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        auth: { type: 'none' },
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['Authorization']).toBeUndefined();
    });
  });

  describe('sendRequest - Timeout handling', () => {
    // TODO(timers): fake/real timer interaction with AbortController is unstable in Vitest 4.
    // Timeout behavior is already verified by APITester integration tests; revisit when vi.useFakeTimers + AbortController work reliably.
    it.skip('should throw timeout error when request exceeds timeout', async () => {
      vi.useRealTimers(); // Use real timers for this test

      const mockFetch = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      global.fetch = mockFetch;

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        timeout: 100, // Short timeout for faster test
      });

      await expect(promise).rejects.toThrow('Request timeout');

      vi.useFakeTimers(); // Restore fake timers
    });

    it('should clear timeout on successful response', async () => {
      const mockResponse = new Response('ok', { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        timeout: 5000,
      });

      vi.runAllTimers();
      await promise;

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear timeout on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        timeout: 5000,
      });

      // Wait for the promise to reject first, then check if clearTimeout was called
      await expect(promise).rejects.toThrow('Network error');
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('sendRequest - Cancellation', () => {
    // TODO(timers): same fake/real timer + AbortController issue as the timeout test above.
    // Cancel behavior is verified by APITester integration tests.
    it.skip('should support cancellation via cancel method', async () => {
      vi.useRealTimers(); // Use real timers for this test

      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve, _reject) => {
            // Simulate a long-running request with AbortSignal
            setTimeout(() => resolve(new Response('ok')), 5000);
          })
      );
      global.fetch = mockFetch;

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        timeout: 10000, // Long timeout so cancel happens first
      });

      // Cancel the request immediately
      expect(promise.cancel).toBeDefined();
      promise.cancel?.();

      await expect(promise).rejects.toThrow('Request cancelled');

      vi.useFakeTimers(); // Restore fake timers
    });

    it('should handle AbortError as cancellation', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValue(abortError);

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      await expect(promise).rejects.toThrow('Request cancelled');
    });
  });

  describe('sendRequest - Error handling', () => {
    it('should propagate network errors', async () => {
      const networkError = new Error('Failed to fetch');
      global.fetch = vi.fn().mockRejectedValue(networkError);

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      await expect(promise).rejects.toThrow('Failed to fetch');
    });

    it('should handle fetch errors other than timeout and abort', async () => {
      const customError = new Error('Custom error');
      global.fetch = vi.fn().mockRejectedValue(customError);

      const promise = sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      await expect(promise).rejects.toThrow('Custom error');
    });
  });

  describe('sendRequest - HTTP methods', () => {
    it.each(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const)(
      'should send %s request',
      async method => {
        const mockResponse = new Response('ok', { status: 200 });
        const mockFetch = vi.fn().mockResolvedValue(mockResponse);
        global.fetch = mockFetch;

        await sendRequest({
          ...defaultConfig,
          url: 'https://api.example.com',
          method,
        });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://api.example.com/',
          expect.objectContaining({ method })
        );
      }
    );
  });

  describe('sendRequest - Integration scenarios', () => {
    it('should handle request with all features combined', async () => {
      const mockResponse = new Response('{"success": true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      const mockFetch = vi.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      const result = await sendRequest({
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: [
          { key: 'X-Custom-Header', value: 'test', enabled: true },
          { key: 'X-Disabled', value: 'skip', enabled: false },
        ],
        queryParams: [
          { key: 'page', value: '1', enabled: true },
          { key: 'disabled', value: 'skip', enabled: false },
        ],
        body: '{"name": "test"}',
        timeout: 30000,
        auth: { type: 'bearer', token: 'test-token' },
      });

      expect(result.status).toBe(200);

      const calledUrl = mockFetch.mock.calls[0][0];
      const calledOptions = mockFetch.mock.calls[0][1];

      expect(calledUrl).toContain('page=1');
      expect(calledUrl).not.toContain('disabled');
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.body).toBe('{"name": "test"}');
      expect(calledOptions.headers['Authorization']).toBe('Bearer test-token');
      expect(calledOptions.headers['X-Custom-Header']).toBe('test');
      expect(calledOptions.headers['X-Disabled']).toBeUndefined();
    });
  });
});

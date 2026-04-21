import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendRequest } from '../httpClient';
import type { RequestConfig } from '../../types';

describe('httpClient', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('sendRequest', () => {
    it('should send a successful GET request', async () => {
      // Mock performance.now for consistent timing
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0) // startTime
        .mockReturnValueOnce(100); // endTime

      const mockResponse = { data: 'test' };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.status).toBe(200);
      expect(result.statusText).toBe('OK');
      expect(result.body).toBe(JSON.stringify(mockResponse));
      expect(result.time).toBe(100); // Mocked time difference
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle POST request with body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{"id": "123"}'),
      });

      const config: RequestConfig = {
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        queryParams: [],
        body: '{"name": "John"}',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: '{"name": "John"}',
        })
      );
      expect(result.status).toBe(201);
    });

    it.skip('should handle timeout - needs fix', async () => {
      // TODO(timers): vi.useFakeTimers() does not advance the AbortController signal used by httpClient,
      // so the rejection never fires. Covered by integration tests in src/components/tools/APITester/__tests__.
      vi.useFakeTimers();

      globalThis.fetch = vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves - simulating slow request
          })
      );

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/slow',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 100, // Short timeout for testing
        auth: { type: 'none' },
      };

      const promise = sendRequest(config);

      // Fast-forward past timeout
      await vi.advanceTimersByTimeAsync(101);

      await expect(promise).rejects.toThrow('Request timeout');
    });

    it('should have cancel method', () => {
      globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/data',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const promise = sendRequest(config);

      // Verify cancel method exists
      expect(promise.cancel).toBeDefined();
      expect(typeof promise.cancel).toBe('function');
    });

    it('should handle network errors', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/error',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await expect(sendRequest(config)).rejects.toThrow('Network error');
    });

    it('should add Bearer token to headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'bearer', token: 'test-token-123' },
      };

      await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should add Basic Auth to headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'basic', username: 'user', password: 'pass' },
      };

      await sendRequest(config);

      const expectedAuth = 'Basic ' + btoa('user:pass');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedAuth,
          }),
        })
      );
    });

    it('should add API key to headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'apiKey', key: 'x-api-key', value: 'secret-key', addTo: 'header' },
      };

      await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'secret-key',
          }),
        })
      );
    });

    it('should add API key to query params', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/protected',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'apiKey', key: 'apikey', value: 'secret-key', addTo: 'query' },
      };

      await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected?apikey=secret-key',
        expect.any(Object)
      );
    });

    it('should handle enabled/disabled headers', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [
          { key: 'X-Enabled', value: 'yes', enabled: true },
          { key: 'X-Disabled', value: 'no', enabled: false },
        ],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Enabled': 'yes',
          }),
        })
      );

      const callArgs = (globalThis.fetch as any).mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('X-Disabled');
    });

    it('should handle enabled/disabled query params', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [
          { key: 'enabled', value: 'yes', enabled: true },
          { key: 'disabled', value: 'no', enabled: false },
        ],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await sendRequest(config);

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain('enabled=yes');
      expect(calledUrl).not.toContain('disabled=no');
    });

    // RED Phase - Testing PUT, DELETE, PATCH methods
    it('should send PUT request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{"updated": true}'),
      });

      const config: RequestConfig = {
        method: 'PUT',
        url: 'https://api.example.com/users/1',
        headers: [],
        queryParams: [],
        body: '{"name": "Updated"}',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: '{"name": "Updated"}',
        })
      );
      expect(result.status).toBe(200);
    });

    it('should send DELETE request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        text: () => Promise.resolve(''),
      });

      const config: RequestConfig = {
        method: 'DELETE',
        url: 'https://api.example.com/users/1',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.status).toBe(204);
    });

    it('should send PATCH request', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{"patched": true}'),
      });

      const config: RequestConfig = {
        method: 'PATCH',
        url: 'https://api.example.com/users/1',
        headers: [],
        queryParams: [],
        body: '{"status": "active"}',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: '{"status": "active"}',
        })
      );
      expect(result.status).toBe(200);
    });

    // Testing HTTP error status codes
    it('should handle 4xx client errors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: () => Promise.resolve('{"error": "Resource not found"}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/users/999',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
      expect(result.body).toContain('Resource not found');
    });

    it('should handle 5xx server errors', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: () => Promise.resolve('{"error": "Server error"}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/error',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.status).toBe(500);
      expect(result.statusText).toBe('Internal Server Error');
    });

    // Testing response metrics
    it('should measure request time', async () => {
      const startTime = 1000;
      const endTime = 1250;
      vi.spyOn(performance, 'now').mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.time).toBe(250); // endTime - startTime
    });

    it('should calculate response size', async () => {
      const responseBody = '{"test": "data", "number": 123}';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve(responseBody),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.size).toBe(new Blob([responseBody]).size);
    });

    // Testing edge cases
    it('should handle empty response body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        text: () => Promise.resolve(''),
      });

      const config: RequestConfig = {
        method: 'DELETE',
        url: 'https://api.example.com/resource',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.body).toBe('');
      expect(result.status).toBe(204);
    });

    it('should handle large response payloads', async () => {
      const largeBody = 'x'.repeat(1000000); // 1MB
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve(largeBody),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/large',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      const result = await sendRequest(config);

      expect(result.body).toBe(largeBody);
      expect(result.size).toBe(new Blob([largeBody]).size);
    });

    it('should handle AbortError as cancellation', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await expect(sendRequest(config)).rejects.toThrow('Request cancelled');
    });

    it('should clear timeout on successful response', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await sendRequest(config);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear timeout on error', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: [],
        queryParams: [],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await expect(sendRequest(config)).rejects.toThrow();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle special characters in query params', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: () => Promise.resolve('{}'),
      });

      const config: RequestConfig = {
        method: 'GET',
        url: 'https://api.example.com/search',
        headers: [],
        queryParams: [
          { key: 'q', value: 'hello world & test', enabled: true },
          { key: 'filter', value: 'status=active', enabled: true },
        ],
        body: '',
        timeout: 30000,
        auth: { type: 'none' },
      };

      await sendRequest(config);

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0];
      // URL encoding should handle special characters
      expect(calledUrl).toContain('q=');
      expect(calledUrl).toContain('filter=');
    });
  });
});

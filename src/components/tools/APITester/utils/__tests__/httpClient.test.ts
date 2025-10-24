import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendRequest } from '../httpClient';
import type { RequestConfig } from '../../types';

describe('httpClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendRequest', () => {
    it('should send a successful GET request', async () => {
      const mockResponse = { data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
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
      expect(result.time).toBeGreaterThan(0);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should handle POST request with body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: '{"name": "John"}',
        })
      );
      expect(result.status).toBe(201);
    });

    it.skip('should handle timeout', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
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

      await expect(sendRequest(config)).rejects.toThrow('Request timeout');
    }, 10000); // 10 second test timeout

    it.skip('should support request cancellation', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

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

      // Cancel immediately
      promise.cancel?.();

      await expect(promise).rejects.toThrow('Request cancelled');
    }, 10000); // 10 second test timeout

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

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
      global.fetch = vi.fn().mockResolvedValue({
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

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should add Basic Auth to headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expectedAuth,
          }),
        })
      );
    });

    it('should add API key to headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'secret-key',
          }),
        })
      );
    });

    it('should add API key to query params', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/protected?apikey=secret-key',
        expect.any(Object)
      );
    });

    it('should handle enabled/disabled headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Enabled': 'yes',
          }),
        })
      );

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('X-Disabled');
    });

    it('should handle enabled/disabled query params', async () => {
      global.fetch = vi.fn().mockResolvedValue({
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

      const calledUrl = (global.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain('enabled=yes');
      expect(calledUrl).not.toContain('disabled=no');
    });
  });
});

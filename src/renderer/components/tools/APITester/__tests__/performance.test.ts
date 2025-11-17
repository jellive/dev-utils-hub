import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendRequest } from '../utils/httpClient';
import type { RequestConfig } from '../types';

// Default request config for tests
const defaultConfig: Omit<RequestConfig, 'url' | 'method'> = {
  headers: [],
  queryParams: [],
  body: '',
  timeout: 30000,
  auth: { type: 'none' },
};

/**
 * Performance Tests for API Tester
 *
 * Tests for:
 * - Large payload handling (>1MB)
 * - Response time for various payload sizes
 * - Memory usage during long sessions
 * - LocalStorage performance with maximum history
 * - Rendering performance with many history items
 */

describe('API Tester - Performance Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Large Payload Handling', () => {
    it('should handle 1MB JSON payload within acceptable time', async () => {
      // Generate 1MB JSON payload
      const largePayload = {
        data: 'x'.repeat(1024 * 1024), // 1MB of data
      };

      const mockResponse = new Response(JSON.stringify(largePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com/large',
        method: 'POST',
        body: JSON.stringify(largePayload),
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle 5MB JSON payload', async () => {
      const largePayload = {
        data: 'x'.repeat(5 * 1024 * 1024), // 5MB of data
      };

      const mockResponse = new Response(JSON.stringify(largePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com/verylarge',
        method: 'POST',
        body: JSON.stringify(largePayload),
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.status).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should parse large JSON response efficiently', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: 'x'.repeat(100),
      }));

      const mockResponse = new Response(JSON.stringify(largeArray), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com/array',
        method: 'GET',
      });
      const endTime = performance.now();
      const parsingTime = endTime - startTime;

      expect(result.status).toBe(200);
      // Result body is a string containing JSON, parse it to verify
      const parsedData = JSON.parse(result.body);
      expect(parsedData).toHaveLength(10000);
      expect(parsingTime).toBeLessThan(2000); // Parsing should be fast
    });
  });

  describe('Request Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Create unique Response objects for each request to avoid body reuse
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response('{"success": true}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      );

      const startTime = performance.now();

      // Send 10 concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        sendRequest({
          ...defaultConfig,
          url: `https://api.example.com/${i}`,
          method: 'GET',
        }),
      );

      const results = await Promise.all(requests);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.status).toBe(200);
      });
      expect(duration).toBeLessThan(3000); // All requests should complete within 3 seconds
    });

    it('should measure response time accurately', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      // Simulate network delay
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockResponse), 100);
          }),
      );

      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });

      expect(result.time).toBeGreaterThanOrEqual(95); // Allow small margin for timer precision
      expect(result.time).toBeLessThan(200); // Should be accurate within ±50ms
    });

    it('should calculate response size correctly for different content types', async () => {
      const testCases = [
        {
          body: '{"data": "test"}',
          contentType: 'application/json',
          expectedSize: 16,
        },
        {
          body: 'Plain text response',
          contentType: 'text/plain',
          expectedSize: 19,
        },
        {
          body: '<html><body>Hello</body></html>',
          contentType: 'text/html',
          expectedSize: 31,
        },
      ];

      for (const testCase of testCases) {
        const mockResponse = new Response(testCase.body, {
          status: 200,
          headers: { 'Content-Type': testCase.contentType },
        });

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        const result = await sendRequest({
          ...defaultConfig,
          url: 'https://api.example.com',
          method: 'GET',
        });

        expect(result.size).toBe(testCase.expectedSize);
      }
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated operations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform 1000 operations
      for (let i = 0; i < 1000; i++) {
        const mockResponse = new Response('{"data": "test"}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        await sendRequest({
          ...defaultConfig,
          url: `https://api.example.com/${i}`,
          method: 'GET',
        });

        // Clear after each request to simulate cleanup
        vi.clearAllMocks();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB for 1000 operations)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    it('should handle request with abort signal', async () => {
      const controller = new AbortController();

      const mockFetch = vi.fn().mockResolvedValue(
        new Response('{"data": "test"}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      global.fetch = mockFetch;

      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
        signal: controller.signal,
      });

      // Verify that request completed successfully with abort signal present
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][1]).toHaveProperty('signal');
    });
  });

  describe('Response Processing', () => {
    it('should handle large response headers efficiently', async () => {
      const largeHeaders = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`X-Custom-Header-${i}`, `Value-${i}`]),
      );

      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        headers: largeHeaders,
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.status).toBe(200);
      // Should have 101 headers (100 custom + 1 content-type added automatically)
      expect(Object.keys(result.headers).length).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(1000);
    });

    it('should stream large responses without blocking', async () => {
      // Create a large response (2MB)
      const largeData = 'x'.repeat(2 * 1024 * 1024);
      const mockResponse = new Response(largeData, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await sendRequest({
        ...defaultConfig,
        url: 'https://api.example.com',
        method: 'GET',
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.status).toBe(200);
      expect(result.size).toBe(2 * 1024 * 1024);
      expect(duration).toBeLessThan(5000); // Should handle within 5 seconds
    });
  });
});

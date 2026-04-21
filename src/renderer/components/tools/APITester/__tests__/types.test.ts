import { describe, it, expect } from 'vitest';
import type {
  HTTPMethod,
  Header,
  QueryParam,
  AuthConfig,
  RequestConfig,
  ResponseData,
  HistoryItem,
  APITesterState,
} from '../types';

describe('APITester Types', () => {
  describe('HTTPMethod', () => {
    it('should accept valid HTTP methods', () => {
      const validMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      expect(validMethods).toHaveLength(7);
    });
  });

  describe('Header', () => {
    it('should create a valid Header object', () => {
      const header: Header = {
        key: 'Content-Type',
        value: 'application/json',
        enabled: true,
      };
      expect(header.key).toBe('Content-Type');
      expect(header.value).toBe('application/json');
      expect(header.enabled).toBe(true);
    });
  });

  describe('QueryParam', () => {
    it('should create a valid QueryParam object', () => {
      const param: QueryParam = {
        key: 'page',
        value: '1',
        enabled: true,
      };
      expect(param.key).toBe('page');
      expect(param.value).toBe('1');
      expect(param.enabled).toBe(true);
    });
  });

  describe('AuthConfig', () => {
    it('should create a Bearer token auth config', () => {
      const auth: AuthConfig = {
        type: 'bearer',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      };
      expect(auth.type).toBe('bearer');
      expect(auth.token).toBeDefined();
    });

    it('should create a Basic auth config', () => {
      const auth: AuthConfig = {
        type: 'basic',
        username: 'user',
        password: 'pass',
      };
      expect(auth.type).toBe('basic');
      expect(auth.username).toBe('user');
      expect(auth.password).toBe('pass');
    });

    it('should create an API Key auth config', () => {
      const auth: AuthConfig = {
        type: 'apiKey',
        key: 'x-api-key',
        value: 'secret-key',
        addTo: 'header',
      };
      expect(auth.type).toBe('apiKey');
      expect(auth.key).toBe('x-api-key');
      expect(auth.value).toBe('secret-key');
      expect(auth.addTo).toBe('header');
    });

    it('should create a none auth config', () => {
      const auth: AuthConfig = {
        type: 'none',
      };
      expect(auth.type).toBe('none');
    });
  });

  describe('RequestConfig', () => {
    it('should create a valid RequestConfig object', () => {
      const request: RequestConfig = {
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        queryParams: [
          { key: 'limit', value: '10', enabled: true },
        ],
        body: '{"name": "John"}',
        timeout: 30000,
        auth: { type: 'none' },
      };
      expect(request.method).toBe('POST');
      expect(request.url).toBe('https://api.example.com/users');
      expect(request.headers).toHaveLength(1);
      expect(request.queryParams).toHaveLength(1);
      expect(request.body).toBe('{"name": "John"}');
      expect(request.timeout).toBe(30000);
      expect(request.auth.type).toBe('none');
    });
  });

  describe('ResponseData', () => {
    it('should create a valid ResponseData object', () => {
      const response: ResponseData = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"success": true}',
        time: 245,
        size: 1024,
      };
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.headers['content-type']).toBe('application/json');
      expect(response.body).toBe('{"success": true}');
      expect(response.time).toBe(245);
      expect(response.size).toBe(1024);
    });
  });

  describe('HistoryItem', () => {
    it('should create a valid HistoryItem object', () => {
      const historyItem: HistoryItem = {
        id: 'hist-123',
        timestamp: Date.now(),
        request: {
          method: 'GET',
          url: 'https://api.example.com/data',
          headers: [],
          queryParams: [],
          body: '',
          timeout: 30000,
          auth: { type: 'none' },
        },
        response: {
          status: 200,
          statusText: 'OK',
          headers: {},
          body: '{}',
          time: 123,
          size: 2,
        },
      };
      expect(historyItem.id).toBe('hist-123');
      expect(historyItem.timestamp).toBeDefined();
      expect(historyItem.request).toBeDefined();
      expect(historyItem.response).toBeDefined();
    });

    it('should create a HistoryItem with error', () => {
      const historyItem: HistoryItem = {
        id: 'hist-456',
        timestamp: Date.now(),
        request: {
          method: 'GET',
          url: 'https://api.example.com/error',
          headers: [],
          queryParams: [],
          body: '',
          timeout: 30000,
          auth: { type: 'none' },
        },
        error: 'Network error',
      };
      expect(historyItem.error).toBe('Network error');
      expect(historyItem.response).toBeUndefined();
    });
  });

  describe('APITesterState', () => {
    it('should create a valid APITesterState object', () => {
      const state: APITesterState = {
        request: {
          method: 'GET',
          url: '',
          headers: [],
          queryParams: [],
          body: '',
          timeout: 30000,
          auth: { type: 'none' },
        },
        response: null,
        loading: false,
        error: null,
        history: [],
      };
      expect(state.request).toBeDefined();
      expect(state.response).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.history).toEqual([]);
    });
  });
});

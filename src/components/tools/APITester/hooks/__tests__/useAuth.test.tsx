import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should initialize with null auth config', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.authConfig).toBeNull();
  });

  it('should set bearer token authentication', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setBearerAuth('test-token-123');
    });

    expect(result.current.authConfig).toEqual({
      mode: 'bearer',
      bearerToken: 'test-token-123',
    });
  });

  it('should set basic authentication', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setBasicAuth('username', 'password');
    });

    expect(result.current.authConfig).toEqual({
      mode: 'basic',
      basicAuth: {
        username: 'username',
        password: 'password',
      },
    });
  });

  it('should set API key authentication with header placement', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('my-api-key', 'X-API-Key', 'header');
    });

    expect(result.current.authConfig).toEqual({
      mode: 'apikey',
      apiKey: {
        key: 'my-api-key',
        keyName: 'X-API-Key',
        placement: 'header',
      },
    });
  });

  it('should set API key authentication with query placement', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('my-api-key', 'api_key', 'query');
    });

    expect(result.current.authConfig).toEqual({
      mode: 'apikey',
      apiKey: {
        key: 'my-api-key',
        keyName: 'api_key',
        placement: 'query',
      },
    });
  });

  it('should clear authentication', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setBearerAuth('test-token');
    });

    expect(result.current.authConfig).not.toBeNull();

    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.authConfig).toBeNull();
  });

  it('should apply bearer token to request headers', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setBearerAuth('my-token');
    });

    const headers = result.current.applyAuth({});

    expect(headers).toEqual({
      Authorization: 'Bearer my-token',
    });
  });

  it('should apply basic auth to request headers', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setBasicAuth('user', 'pass');
    });

    const headers = result.current.applyAuth({});

    // Base64 of 'user:pass' is 'dXNlcjpwYXNz'
    expect(headers).toEqual({
      Authorization: 'Basic dXNlcjpwYXNz',
    });
  });

  it('should apply API key to request headers when placement is header', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('secret-key', 'X-Custom-Key', 'header');
    });

    const headers = result.current.applyAuth({});

    expect(headers).toEqual({
      'X-Custom-Key': 'secret-key',
    });
  });

  it('should merge API key with existing headers', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('secret-key', 'X-API-Key', 'header');
    });

    const headers = result.current.applyAuth({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': 'secret-key',
    });
  });

  it('should not modify headers when auth config is null', () => {
    const { result } = renderHook(() => useAuth());

    const originalHeaders = {
      'Content-Type': 'application/json',
    };

    const headers = result.current.applyAuth(originalHeaders);

    expect(headers).toEqual(originalHeaders);
  });

  it('should not apply API key to headers when placement is query', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('secret-key', 'api_key', 'query');
    });

    const headers = result.current.applyAuth({});

    // When placement is 'query', it should not be added to headers
    expect(headers).toEqual({});
  });

  it('should get query parameters for API key when placement is query', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('my-secret', 'apiKey', 'query');
    });

    const queryParams = result.current.getQueryParams();

    expect(queryParams).toEqual({
      apiKey: 'my-secret',
    });
  });

  it('should return empty object for query params when placement is header', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setApiKeyAuth('my-secret', 'X-API-Key', 'header');
    });

    const queryParams = result.current.getQueryParams();

    expect(queryParams).toEqual({});
  });

  it('should return empty object for query params when auth is not apikey', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setBearerAuth('token');
    });

    const queryParams = result.current.getQueryParams();

    expect(queryParams).toEqual({});
  });

  it('should return empty object for query params when auth config is null', () => {
    const { result } = renderHook(() => useAuth());

    const queryParams = result.current.getQueryParams();

    expect(queryParams).toEqual({});
  });
});

import { useState } from 'react';

export interface AuthConfig {
  mode: 'bearer' | 'basic' | 'apikey';
  bearerToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
  apiKey?: {
    key: string;
    keyName: string;
    placement: 'header' | 'query';
  };
}

export function useAuth() {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

  const setBearerAuth = (token: string) => {
    setAuthConfig({
      mode: 'bearer',
      bearerToken: token,
    });
  };

  const setBasicAuth = (username: string, password: string) => {
    setAuthConfig({
      mode: 'basic',
      basicAuth: {
        username,
        password,
      },
    });
  };

  const setApiKeyAuth = (key: string, keyName: string, placement: 'header' | 'query') => {
    setAuthConfig({
      mode: 'apikey',
      apiKey: {
        key,
        keyName,
        placement,
      },
    });
  };

  const clearAuth = () => {
    setAuthConfig(null);
  };

  const applyAuth = (headers: Record<string, string>): Record<string, string> => {
    if (!authConfig) {
      return headers;
    }

    const newHeaders = { ...headers };

    if (authConfig.mode === 'bearer' && authConfig.bearerToken) {
      newHeaders['Authorization'] = `Bearer ${authConfig.bearerToken}`;
    } else if (authConfig.mode === 'basic' && authConfig.basicAuth) {
      const credentials = `${authConfig.basicAuth.username}:${authConfig.basicAuth.password}`;
      const encoded = btoa(credentials);
      newHeaders['Authorization'] = `Basic ${encoded}`;
    } else if (authConfig.mode === 'apikey' && authConfig.apiKey) {
      if (authConfig.apiKey.placement === 'header') {
        newHeaders[authConfig.apiKey.keyName] = authConfig.apiKey.key;
      }
    }

    return newHeaders;
  };

  const getQueryParams = (): Record<string, string> => {
    if (!authConfig) {
      return {};
    }

    if (authConfig.mode === 'apikey' && authConfig.apiKey && authConfig.apiKey.placement === 'query') {
      return {
        [authConfig.apiKey.keyName]: authConfig.apiKey.key,
      };
    }

    return {};
  };

  return {
    authConfig,
    setBearerAuth,
    setBasicAuth,
    setApiKeyAuth,
    clearAuth,
    applyAuth,
    getQueryParams,
  };
}

/** Supported HTTP methods for API requests */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/** HTTP header key-value pair with toggle */
export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

/** URL query parameter with toggle */
export interface QueryParam {
  key: string;
  value: string;
  enabled: boolean;
}

/** Authentication configuration supporting multiple auth types */
export type AuthConfig =
  | { type: 'none' }
  | { type: 'bearer'; token: string }
  | { type: 'basic'; username: string; password: string }
  | { type: 'apiKey'; key: string; value: string; addTo: 'header' | 'query' };

/** Complete API request configuration */
export interface RequestConfig {
  method: HTTPMethod;
  url: string;
  headers: Header[];
  queryParams: QueryParam[];
  body: string;
  timeout: number;
  auth: AuthConfig;
}

/** API response data with metadata */
export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number; // Response time in milliseconds
  size: number; // Response size in bytes
}

/** Historical record of an API request/response */
export interface HistoryItem {
  id: string;
  timestamp: number;
  request: RequestConfig;
  response?: ResponseData;
  error?: string;
}

/** Complete application state for API Tester */
export interface APITesterState {
  request: RequestConfig;
  response: ResponseData | null;
  loading: boolean;
  error: string | null;
  history: HistoryItem[];
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send } from 'lucide-react';
import type { HTTPMethod, ResponseData, Header } from './types';
import { MethodSelector } from './components/MethodSelector';
import { URLInput } from './components/URLInput';
import { HeadersEditor } from './components/HeadersEditor';
import { AuthTab, type AuthConfig } from './components/AuthTab';
import { QueryParamsEditor, type QueryParam } from './components/QueryParamsEditor';
import { BodyEditor } from './components/BodyEditor';
import { ResponseTabs } from './components/ResponseTabs';
import { HistoryPanel } from './components/HistoryPanel';
import { HistoryList } from './components/HistoryList';
import { SendButton } from './components/SendButton';
import { ErrorMessage } from './components/ErrorMessage';
import { useHistory } from './hooks/useHistory';
import { useFormValidation } from './hooks/useFormValidation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function APITester() {
  const [method, setMethod] = useState<HTTPMethod>('GET');
  const [url, setUrl] = useState('');
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [headers, setHeaders] = useState<Header[]>([]);
  const [body, setBody] = useState('');
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Form validation with debounce
  const validation = useFormValidation({ debounceMs: 300 });

  // Validate fields when they change
  useEffect(() => {
    validation.validateURL(url);
  }, [url, validation.validateURL]);

  useEffect(() => {
    validation.validateBody(body);
  }, [body, validation.validateBody]);

  useEffect(() => {
    validation.validateHeaders(headers);
  }, [headers, validation.validateHeaders]);

  const handleSendRequest = useCallback(async () => {
    // Validate all fields before sending
    const isValid = validation.validateAll({ url, body, headers });
    if (!isValid) {
      setError('Please fix validation errors before sending');
      return;
    }

    if (!url) {
      setError('URL is required');
      return;
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Build headers
      const requestHeaders: Record<string, string> = {};

      headers.forEach((header) => {
        if (header.enabled && header.key && header.value) {
          requestHeaders[header.key] = header.value;
        }
      });

      // Add auth header
      if (authConfig) {
        if (authConfig.mode === 'bearer' && authConfig.bearerToken) {
          requestHeaders['Authorization'] = `Bearer ${authConfig.bearerToken}`;
        } else if (authConfig.mode === 'basic' && authConfig.basicAuth) {
          const credentials = `${authConfig.basicAuth.username}:${authConfig.basicAuth.password}`;
          const encoded = btoa(credentials);
          requestHeaders['Authorization'] = `Basic ${encoded}`;
        } else if (authConfig.mode === 'apikey' && authConfig.apiKey) {
          if (authConfig.apiKey.placement === 'header') {
            requestHeaders[authConfig.apiKey.keyName] = authConfig.apiKey.key;
          }
        }
      }

      const fetchResponse = await fetch(url, {
        method,
        headers: requestHeaders,
        body: method !== 'GET' && body ? body : undefined,
        signal: abortControllerRef.current.signal,
      });

      const endTime = performance.now();
      const responseText = await fetchResponse.text();

      const responseData: ResponseData = {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        body: responseText,
        time: endTime - startTime,
        size: new Blob([responseText]).size,
      };

      setResponse(responseData);

      // Save to history
      history.saveToHistory({
        method,
        url,
        headers: requestHeaders,
        body,
        response: responseData,
      });
    } catch (err) {
      // Don't handle aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);

      // Save error to history
      history.saveToHistory({
        method,
        url,
        headers: {},
        body,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body, authConfig, history]);

  const handleCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  const handleClearForm = useCallback(() => {
    setUrl('');
    setBody('');
    setHeaders([]);
    setQueryParams([]);
    setResponse(null);
    setError(null);
    validation.clearAllErrors();
  }, [validation]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSend: handleSendRequest,
    onCancel: handleCancelRequest,
    onClear: handleClearForm,
    enabled: !loading,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            API Tester
          </CardTitle>
          <CardDescription>
            Test HTTP/REST APIs with comprehensive request and response inspection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Request Builder */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <MethodSelector value={method} onChange={setMethod} />
                <div className="flex-1 space-y-1">
                  <URLInput value={url} onChange={setUrl} />
                  <ErrorMessage message={validation.errors.url} />
                </div>
                <SendButton
                  onSend={handleSendRequest}
                  onCancel={handleCancelRequest}
                  disabled={!url || !validation.isValid}
                  loading={loading}
                />
              </div>
            </div>

            <Tabs defaultValue="params" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="params">Query Params</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="auth">Authorization</TabsTrigger>
              </TabsList>
              <TabsContent value="params" className="space-y-2">
                <QueryParamsEditor params={queryParams} onChange={setQueryParams} />
              </TabsContent>
              <TabsContent value="headers" className="space-y-2">
                <HeadersEditor headers={headers} onChange={setHeaders} />
                <ErrorMessage message={validation.errors.headers} />
              </TabsContent>
              <TabsContent value="body" className="space-y-2">
                <BodyEditor value={body} onChange={setBody} />
                <ErrorMessage message={validation.errors.body} />
              </TabsContent>
              <TabsContent value="auth" className="space-y-2">
                <AuthTab onAuthChange={setAuthConfig} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive">
              {error}
            </div>
          )}

          {/* Response Display */}
          {response && <ResponseTabs response={response} />}
        </CardContent>
      </Card>

      {/* History Panel */}
      <HistoryPanel count={history.items.length} onClear={history.clearHistory}>
        <HistoryList
          items={history.items}
          onRestore={(item) => {
            setMethod(item.method as HTTPMethod);
            setUrl(item.url);
            setBody(item.body);
          }}
          onDelete={history.deleteItem}
        />
      </HistoryPanel>
    </div>
  );
}

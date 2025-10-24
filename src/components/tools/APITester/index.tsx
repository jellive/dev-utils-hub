import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useHistory } from './hooks/useHistory';

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

  const handleSendRequest = async () => {
    if (!url) {
      setError('URL is required');
      return;
    }

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
  };

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
            <div className="flex gap-2">
              <MethodSelector value={method} onChange={setMethod} />
              <URLInput value={url} onChange={setUrl} />
              <Button onClick={handleSendRequest} disabled={loading || !url}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send'}
              </Button>
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
              </TabsContent>
              <TabsContent value="body" className="space-y-2">
                <BodyEditor value={body} onChange={setBody} />
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

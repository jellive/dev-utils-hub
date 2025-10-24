import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import type { HTTPMethod, ResponseData, Header } from './types';
import { MethodSelector } from './components/MethodSelector';
import { URLInput } from './components/URLInput';
import { HeadersEditor } from './components/HeadersEditor';
import { AuthTab, type AuthConfig } from './components/AuthTab';

export function APITester() {
  const [method, setMethod] = useState<HTTPMethod>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([]);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendRequest = async () => {
    if (!url) {
      setError('URL is required');
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Build headers from HeadersEditor and AuthConfig
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add headers from HeadersEditor
      headers.forEach((header) => {
        if (header.enabled && header.key && header.value) {
          requestHeaders[header.key] = header.value;
        }
      });

      // Add auth header if configured
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
      });

      const endTime = performance.now();
      const responseText = await fetchResponse.text();

      setResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        body: responseText,
        time: endTime - startTime,
        size: new Blob([responseText]).size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
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
              <Button onClick={handleSendRequest} disabled={loading}>
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
                <p className="text-sm text-muted-foreground">Add query parameters to your request</p>
              </TabsContent>
              <TabsContent value="headers" className="space-y-2">
                <HeadersEditor headers={headers} onChange={setHeaders} />
              </TabsContent>
              <TabsContent value="body" className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm"
                  rows={8}
                />
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
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  Response
                  <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                    {response.status} {response.statusText}
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {response.time.toFixed(2)}ms • {(response.size / 1024).toFixed(2)}KB
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="body">
                  <TabsList>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="body">
                    <pre className="p-4 bg-muted rounded-lg overflow-auto max-h-96 text-sm">
                      {response.body}
                    </pre>
                  </TabsContent>
                  <TabsContent value="headers">
                    <div className="space-y-2">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-sm">
                          <span className="font-semibold">{key}:</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

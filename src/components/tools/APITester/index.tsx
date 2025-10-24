import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, History, Settings } from 'lucide-react';
import type { HTTPMethod, RequestConfig, ResponseData, HistoryItem } from './types';

const HTTP_METHODS: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export function APITester() {
  const { t } = useTranslation();
  const [method, setMethod] = useState<HTTPMethod>('GET');
  const [url, setUrl] = useState('');
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
      const fetchResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
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
              <div className="w-32">
                <Select value={method} onValueChange={(value) => setMethod(value as HTTPMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        <Badge variant={m === 'GET' ? 'default' : m === 'DELETE' ? 'destructive' : 'secondary'}>
                          {m}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="https://api.example.com/endpoint"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
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
                <p className="text-sm text-muted-foreground">Set custom headers for your request</p>
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
                <p className="text-sm text-muted-foreground">Configure authentication settings</p>
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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Link2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

type EncodingMode = 'full' | 'query';

interface URLComponents {
  protocol?: string;
  host?: string;
  port?: string;
  pathname?: string;
  search?: string;
  hash?: string;
}

interface QueryParam {
  key: string;
  value: string;
}

export function URLConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [encodingMode, setEncodingMode] = useState<EncodingMode>('full');
  const [urlComponents, setUrlComponents] = useState<URLComponents | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);

  const parseURL = (urlString: string): URLComponents | null => {
    try {
      const url = new URL(urlString);
      return {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      };
    } catch {
      return null;
    }
  };

  const parseQueryParams = (urlString: string): QueryParam[] => {
    try {
      const url = new URL(urlString);
      const params: QueryParam[] = [];
      url.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      return params;
    } catch {
      return [];
    }
  };

  const validateURL = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleEncode = () => {
    if (!input.trim()) {
      toast.error('Input is empty. Please enter text to encode.');
      return;
    }

    try {
      let encoded: string;
      if (encodingMode === 'full') {
        encoded = encodeURI(input);
      } else {
        encoded = encodeURIComponent(input);
      }
      setOutput(encoded);

      // Parse URL components if input is a valid URL
      const components = parseURL(input);
      if (components) {
        setUrlComponents(components);
        setQueryParams(parseQueryParams(input));
        setIsValidUrl(true);
      } else {
        setUrlComponents(null);
        setQueryParams([]);
        setIsValidUrl(false);
      }

      toast.success('Text encoded successfully!');
    } catch (err) {
      toast.error('Failed to encode text. Please try again.');
      setOutput('');
    }
  };

  const handleDecode = () => {
    if (!input.trim()) {
      toast.error('Input is empty. Please enter URL encoded text to decode.');
      return;
    }

    try {
      // Replace + with space before decoding (common in query strings)
      const normalizedInput = input.replace(/\+/g, ' ');
      const decoded = decodeURIComponent(normalizedInput);
      setOutput(decoded);

      // Parse URL components if decoded result is a valid URL
      const components = parseURL(decoded);
      if (components) {
        setUrlComponents(components);
        setQueryParams(parseQueryParams(decoded));
        setIsValidUrl(true);
      } else {
        setUrlComponents(null);
        setQueryParams([]);
        setIsValidUrl(validateURL(input));
      }

      toast.success('Text decoded successfully!');
    } catch (err) {
      toast.error('Invalid URL encoding. Please check your input.');
      setOutput('');
      setUrlComponents(null);
      setQueryParams([]);
      setIsValidUrl(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setUrlComponents(null);
    setQueryParams([]);
    setIsValidUrl(null);
  };

  const exampleURLs = [
    {
      label: 'Simple URL',
      value: 'https://example.com/path?key=value',
    },
    {
      label: 'Korean Text',
      value: 'https://example.com/search?q=한글 검색어',
    },
    {
      label: 'Special Chars',
      value: 'https://example.com/path?name=John Doe&email=john@example.com',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">URL Encoder/Decoder</h2>

      <Tabs defaultValue="encode" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encode">Encode</TabsTrigger>
          <TabsTrigger value="decode">Decode</TabsTrigger>
        </TabsList>

        {/* Encode Tab */}
        <TabsContent value="encode" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Input Text</CardTitle>
                  <CardDescription>Enter text or URL to encode</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        <strong>Full URL:</strong> Encodes entire URL preserving structure<br/>
                        <strong>Query Params:</strong> Encodes only parameter values
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text or URL to encode..."
                className="font-mono min-h-[120px]"
              />

              <div className="flex items-center gap-2">
                <Select value={encodingMode} onValueChange={(v) => setEncodingMode(v as EncodingMode)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full URL</SelectItem>
                    <SelectItem value="query">Query Parameters</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleEncode} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Encode
                </Button>
                <Button onClick={handleClear} variant="outline">
                  Clear
                </Button>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleURLs.map((example) => (
                    <TooltipProvider key={example.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(example.value)}
                          >
                            {example.label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{example.value}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          {output && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Encoded Output</CardTitle>
                  <Button onClick={() => handleCopy(output)} variant="ghost" size="sm" className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={output}
                  readOnly
                  className="font-mono min-h-[120px] bg-gray-50 dark:bg-gray-800"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Decode Tab */}
        <TabsContent value="decode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Encoded Input</CardTitle>
              <CardDescription>Enter URL encoded text to decode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter URL encoded text to decode..."
                className="font-mono min-h-[120px]"
              />

              <div className="flex items-center gap-2">
                <Button onClick={handleDecode} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Decode
                </Button>
                <Button onClick={handleClear} variant="outline">
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          {output && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Decoded Output</CardTitle>
                  <Button onClick={() => handleCopy(output)} variant="ghost" size="sm" className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={output}
                  readOnly
                  className="font-mono min-h-[120px] bg-gray-50 dark:bg-gray-800"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* URL Validation Feedback */}
      {isValidUrl !== null && (
        <Alert variant={isValidUrl ? 'default' : 'destructive'}>
          {isValidUrl ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {isValidUrl ? 'Valid URL format detected' : 'Not a valid URL format'}
          </AlertDescription>
        </Alert>
      )}

      {/* URL Component Breakdown */}
      {urlComponents && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">URL Components</CardTitle>
            <CardDescription>Structured breakdown of the URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {urlComponents.protocol && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Protocol</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.protocol}</p>
                </div>
              )}
              {urlComponents.host && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Host</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.host}</p>
                </div>
              )}
              {urlComponents.port && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Port</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.port}</p>
                </div>
              )}
              {urlComponents.pathname && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Path</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.pathname}</p>
                </div>
              )}
              {urlComponents.search && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Query String</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.search}</p>
                </div>
              )}
              {urlComponents.hash && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fragment</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.hash}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Query Parameters Table */}
      {queryParams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Query Parameters</CardTitle>
            <CardDescription>Parsed URL parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryParams.map((param, index) => (
                  <TableRow key={`${param.key}-${index}`}>
                    <TableCell className="font-mono text-sm">{param.key}</TableCell>
                    <TableCell className="font-mono text-sm">{param.value}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleCopy(`${param.key}=${param.value}`)}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          URL Encoding Guide
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>Full URL:</strong> Preserves URL structure (http://, /path, etc.)</li>
          <li>• <strong>Query Parameters:</strong> Encodes all special characters</li>
          <li>• Supports UTF-8 encoding (Korean, emojis, special characters)</li>
          <li>• Handles both %20 and + for spaces in query strings</li>
          <li>• Automatically parses URL components and query parameters</li>
        </ul>
      </div>
    </div>
  );
}

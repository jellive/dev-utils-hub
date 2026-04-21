import { useState, useEffect } from 'react';
import { api } from '../../lib/tauri-api';
import { useTranslation } from 'react-i18next';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { useHistoryExportImport } from '../../hooks/useHistoryExportImport';
import { ExportDialog } from '../dialogs/ExportDialog';
import { ImportDialog } from '../dialogs/ImportDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Link2, AlertCircle, CheckCircle2, HelpCircle, Upload, FileDown } from 'lucide-react';
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
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [encodingMode, setEncodingMode] = useState<EncodingMode>('full');
  const [urlComponents, setUrlComponents] = useState<URLComponents | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParam[]>([]);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Use the new useHistoryExportImport hook with URL parsing
  const {
    isExporting,
    isImporting,
    showExportDialog,
    showImportDialog,
    setShowExportDialog,
    setShowImportDialog,
    handleExport,
    handleImport,
  } = useHistoryExportImport({
    tool: 'url',
    toolDisplayName: 'URL Converter',
    parseImportData: (content, format) => {
      // Parse based on format
      if (format === 'json') {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) throw new Error('JSON must be an array');
        return data.map((item: unknown) => {
          const record = item as Record<string, unknown>;
          return {
            input: String(record.input || ''),
            output: record.output ? String(record.output) : undefined,
          };
        });
      } else if (format === 'csv') {
        const lines = content.split('\n').filter(line => line.trim());
        const dataLines = lines.slice(1); // Skip header
        return dataLines.map(line => {
          const values = line.split(',').map(val => val.trim().replace(/^"|"$/g, ''));
          return { input: values[0] || '', output: values[1] || undefined };
        });
      } else {
        // TXT format: one URL per line
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({ input: line.trim(), output: undefined }));
      }
    },
  });

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'url' });

  // Get total count for ExportDialog
  useEffect(() => {
    const fetchCount = async () => {
      if (api?.history) {
        try {
          const count = await api.history.count('url');
          setTotalCount(count);
        } catch (error) {
          console.error('Failed to get history count:', error);
        }
      }
    };
    fetchCount();
  }, [output]); // Refetch when URL is encoded/decoded

  // Save to history when output changes
  useEffect(() => {
    if (output && isValidUrl) {
      saveToHistory(input, output, { encodingMode, urlComponents });
    }
  }, [output, isValidUrl, input, encodingMode, urlComponents, saveToHistory]);

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

      toast.success(t('common.success'));
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

      toast.success(t('common.success'));
    } catch (err) {
      toast.error(t('tools.url.invalidUrl'));
      setOutput('');
      setUrlComponents(null);
      setQueryParams([]);
      setIsValidUrl(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('common.copied'));
    } catch (err) {
      toast.error(t('common.copyFailed'));
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.url.title')}</h2>

      <Tabs defaultValue="encode" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encode">{t('tools.url.encodeTab')}</TabsTrigger>
          <TabsTrigger value="decode">{t('tools.url.decodeTab')}</TabsTrigger>
        </TabsList>

        {/* Encode Tab */}
        <TabsContent value="encode" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('tools.url.input')}</CardTitle>
                  <CardDescription>{t('tools.url.description')}</CardDescription>
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
                        <strong>{t('tools.url.fullUrl')}:</strong> Encodes entire URL preserving
                        structure
                        <br />
                        <strong>{t('tools.url.queryOnly')}:</strong> Encodes only parameter values
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('tools.url.enterUrl')}
                className="font-mono min-h-[120px]"
              />

              <div className="flex items-center gap-2">
                <Select
                  value={encodingMode}
                  onValueChange={v => setEncodingMode(v as EncodingMode)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">{t('tools.url.fullUrl')}</SelectItem>
                    <SelectItem value="query">{t('tools.url.queryOnly')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleEncode} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  {t('common.encode')}
                </Button>
                <Button onClick={handleClear} variant="outline">
                  {t('common.clear')}
                </Button>
                <Button
                  onClick={() => setShowExportDialog(true)}
                  variant="outline"
                  disabled={isExporting}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {t('common.export')}
                </Button>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  disabled={isImporting}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  {t('common.import')}
                </Button>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('tools.url.exampleUrls')}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {exampleURLs.map(example => (
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
                  <CardTitle>{t('tools.url.output')}</CardTitle>
                  <Button
                    onClick={() => handleCopy(output)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {t('common.copy')}
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
              <CardTitle>{t('tools.url.input')}</CardTitle>
              <CardDescription>{t('tools.url.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('tools.url.enterUrl')}
                className="font-mono min-h-[120px]"
              />

              <div className="flex items-center gap-2">
                <Button onClick={handleDecode} className="gap-2">
                  <Link2 className="h-4 w-4" />
                  {t('common.decode')}
                </Button>
                <Button onClick={handleClear} variant="outline">
                  {t('common.clear')}
                </Button>
                <Button
                  onClick={() => setShowExportDialog(true)}
                  variant="outline"
                  disabled={isExporting}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {t('common.export')}
                </Button>
                <Button
                  onClick={() => setShowImportDialog(true)}
                  variant="outline"
                  disabled={isImporting}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  {t('common.import')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output */}
          {output && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('tools.url.output')}</CardTitle>
                  <Button
                    onClick={() => handleCopy(output)}
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {t('common.copy')}
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
          {isValidUrl ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            {isValidUrl ? 'Valid URL format detected' : t('tools.url.invalidUrl')}
          </AlertDescription>
        </Alert>
      )}

      {/* URL Component Breakdown */}
      {urlComponents && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('tools.url.components')}</CardTitle>
            <CardDescription>Structured breakdown of the URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {urlComponents.protocol && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tools.url.protocol')}
                  </p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.protocol}</p>
                </div>
              )}
              {urlComponents.host && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tools.url.host')}</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.host}</p>
                </div>
              )}
              {urlComponents.port && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tools.url.port')}</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.port}</p>
                </div>
              )}
              {urlComponents.pathname && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tools.url.path')}</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.pathname}</p>
                </div>
              )}
              {urlComponents.search && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('tools.url.query')}</p>
                  <p className="font-mono text-sm font-semibold">{urlComponents.search}</p>
                </div>
              )}
              {urlComponents.hash && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('tools.url.fragment')}
                  </p>
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
            <CardTitle className="text-base">{t('tools.url.queryParams')}</CardTitle>
            <CardDescription>Parsed URL parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tools.url.key')}</TableHead>
                  <TableHead>{t('tools.url.value')}</TableHead>
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

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title={t('tools.url.history.exportTitle')}
        description={t('tools.url.history.exportDescription')}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title={t('tools.url.history.importTitle')}
        description={t('tools.url.history.importDescription')}
      />
    </div>
  );
}

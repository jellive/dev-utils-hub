import { useState, useEffect } from 'react';
import { api } from '../../lib/tauri-api';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Copy, Check, Upload, FileDown, Send } from 'lucide-react';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { useHistoryExportImport } from '../../hooks/useHistoryExportImport';
import { ExportDialog } from '../dialogs/ExportDialog';
import { ImportDialog } from '../dialogs/ImportDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface JsonFormatterProps {
  initialInput?: string;
  onSendToBase64?: (value: string) => void;
}

export function JsonFormatter({ initialInput = '', onSendToBase64 }: JsonFormatterProps = {}) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentLevel, setIndentLevel] = useState('2');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Use the new useHistoryExportImport hook with JSON parsing
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
    tool: 'json',
    toolDisplayName: 'JSON Formatter',
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
        // TXT format: one JSON per line
        const lines = content.split('\n').filter(line => line.trim());
        return lines.map(line => ({ input: line.trim(), output: undefined }));
      }
    },
  });

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'json' });

  // Get total count for ExportDialog
  useEffect(() => {
    const fetchCount = async () => {
      if (api?.history) {
        try {
          const count = await api.history.count('json');
          setTotalCount(count);
        } catch (error) {
          console.error('Failed to get history count:', error);
        }
      }
    };
    fetchCount();
  }, [output]); // Refetch when JSON is formatted

  // Save to history when output changes
  useEffect(() => {
    if (output && isValid) {
      saveToHistory(input, output, { indentLevel });
    }
  }, [output, isValid, input, indentLevel, saveToHistory]);

  const handleFormat = () => {
    setError('');

    if (!input.trim()) {
      setError('Input is empty');
      setIsValid(false);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, parseInt(indentLevel));
      setOutput(formatted);
      setIsValid(true);
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setOutput('');
      setIsValid(false);
    }
  };

  const handleCompress = () => {
    setError('');

    if (!input.trim()) {
      setError('Input is empty');
      setIsValid(false);
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const compressed = JSON.stringify(parsed);
      setOutput(compressed);
      setIsValid(true);
    } catch (err) {
      setError('Invalid JSON: ' + (err as Error).message);
      setOutput('');
      setIsValid(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setIsValid(null);
  };

  const handleSendToBase64 = () => {
    if (!output) {
      toast.error('No formatted JSON to send');
      return;
    }
    if (onSendToBase64) {
      onSendToBase64(output);
      toast.success(t('common.sendToBase64'));
    }
  };

  const handleCopy = async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        toast.success(t('common.copied'));
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error(t('common.copyFailed'));
      }
    }
  };

  return (
    <Card role="region" aria-label="JSON Formatter Tool">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('tools.json.title')}</CardTitle>
            <CardDescription>{t('tools.json.description')}</CardDescription>
          </div>
          {isValid !== null && (
            <Badge
              variant={isValid ? 'default' : 'destructive'}
              className={isValid ? 'bg-green-500' : ''}
            >
              {isValid ? t('tools.json.valid') : t('tools.json.invalid')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="json-input">{t('tools.json.input')}</Label>
            <Textarea
              id="json-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('tools.json.pasteJson')}
              className={`h-96 font-mono text-sm resize-none ${error ? 'border-destructive' : ''}`}
            />
          </div>

          {/* Output Section */}
          <div className="space-y-2">
            <Label htmlFor="json-output">{t('tools.json.output')}</Label>
            <Textarea
              id="json-output"
              aria-label="Formatted Output"
              value={output}
              readOnly
              placeholder={t('tools.json.output')}
              className="h-96 font-mono text-sm bg-muted resize-none"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" role="alert" className="border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="indent-select" className="text-sm">
              Indent:
            </Label>
            <Select value={indentLevel} onValueChange={setIndentLevel}>
              <SelectTrigger id="indent-select" aria-label="Indent Level" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleFormat} className="bg-primary">
                    {t('common.format')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Prettify JSON with indentation</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleCompress} variant="secondary">
                    {t('tools.json.compress')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Remove whitespace and minify</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleCopy} disabled={!output} variant="outline">
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {t('common.copy')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleClear} variant="ghost" className="variant-ghost">
                    {t('common.clear')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Clear all fields</p>
                </TooltipContent>
              </Tooltip>

              {onSendToBase64 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleSendToBase64} disabled={!output} variant="secondary">
                      <Send className="h-4 w-4 mr-2" />
                      {t('common.sendToBase64')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent role="tooltip">
                    <p>Send formatted JSON to Base64 Converter</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowExportDialog(true)}
                    variant="outline"
                    disabled={isExporting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('common.export')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Export history to file</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowImportDialog(true)}
                    variant="outline"
                    disabled={isImporting}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {t('common.import')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Import history from file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        totalCount={totalCount}
        title="JSON 히스토리 내보내기"
        description="내보낼 JSON 히스토리 개수와 파일 형식을 선택하세요"
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImport}
        title="JSON 파일 가져오기"
        description="JSON 파일을 선택하여 히스토리에 추가하세요. 지원 형식: TXT, JSON, CSV"
      />
    </Card>
  );
}

// Router-aware wrapper used by the app router — reads incoming state and provides navigation
export function JsonFormatterRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { jsonInput?: string } | null;

  const handleSendToBase64 = (value: string) => {
    navigate('/base64', { state: { base64Input: value } });
  };

  return (
    <JsonFormatter initialInput={state?.jsonInput ?? ''} onSendToBase64={handleSendToBase64} />
  );
}

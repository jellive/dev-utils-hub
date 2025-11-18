import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Copy, Check, Send, Save, FolderOpen } from 'lucide-react';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { useFileSystem } from '../../hooks/useFileSystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function JsonFormatter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentLevel, setIndentLevel] = useState('2');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  // File system hook
  const { saveFile, openFile, isSaving, isOpening } = useFileSystem({
    saveSuccessMessage: 'JSON 파일이 저장되었습니다',
    openSuccessMessage: 'JSON 파일을 불러왔습니다',
    errorMessage: '파일 작업 실패'
  });

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'json' });

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

  const sendToAPITester = () => {
    if (!output || !isValid) {
      toast.error('No valid JSON to send');
      return;
    }

    // Navigate to API Tester with formatted JSON body
    navigate('/api-tester', {
      state: {
        body: output,
      },
    });
    toast.success('JSON sent to API Tester');
  };

  const handleSaveToFile = async () => {
    if (!output) {
      toast.error('저장할 JSON이 없습니다');
      return;
    }

    await saveFile(output, `json-${Date.now()}.json`, [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]);
  };

  const handleOpenFile = async () => {
    const result = await openFile([
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]);

    if (result.success && result.content) {
      setInput(result.content);
      // Auto-format the loaded JSON
      try {
        const parsed = JSON.parse(result.content);
        const formatted = JSON.stringify(parsed, null, parseInt(indentLevel));
        setOutput(formatted);
        setIsValid(true);
        setError('');
      } catch (err) {
        setError('Invalid JSON in file: ' + (err as Error).message);
        setOutput('');
        setIsValid(false);
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
            <Badge variant={isValid ? 'default' : 'destructive'} className={isValid ? 'bg-green-500' : ''}>
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
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('tools.json.pasteJson')}
              className={`h-96 font-mono text-sm resize-none ${
                error ? 'border-destructive' : ''
              }`}
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
              <SelectTrigger
                id="indent-select"
                aria-label="Indent Level"
                className="w-32"
              >
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
                  <Button
                    onClick={handleCopy}
                    disabled={!output}
                    variant="outline"
                  >
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

              {output && isValid && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={sendToAPITester} variant="secondary">
                      <Send className="h-4 w-4 mr-2" />
                      Send to API Tester
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent role="tooltip">
                    <p>Send formatted JSON to API Tester as request body</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSaveToFile}
                    variant="outline"
                    disabled={isSaving || !output}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {t('tools.json.save')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Save JSON to file</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleOpenFile}
                    variant="outline"
                    disabled={isOpening}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    {t('tools.json.open')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Open JSON from file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

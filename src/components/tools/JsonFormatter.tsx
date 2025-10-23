import { useState } from 'react';
import { AlertCircle, Copy, Check } from 'lucide-react';
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

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentLevel, setIndentLevel] = useState('2');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

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
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  return (
    <Card role="region" aria-label="JSON Formatter Tool">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>JSON Formatter</CardTitle>
            <CardDescription>Format, validate, and compress JSON data</CardDescription>
          </div>
          {isValid !== null && (
            <Badge variant={isValid ? 'default' : 'destructive'} className={isValid ? 'bg-green-500' : ''}>
              {isValid ? 'Valid' : 'Invalid'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="json-input">Input JSON</Label>
            <Textarea
              id="json-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your JSON here..."
              className={`h-96 font-mono text-sm resize-none ${
                error ? 'border-destructive' : ''
              }`}
            />
          </div>

          {/* Output Section */}
          <div className="space-y-2">
            <Label htmlFor="json-output">Formatted Output</Label>
            <Textarea
              id="json-output"
              aria-label="Formatted Output"
              value={output}
              readOnly
              placeholder="Formatted JSON will appear here..."
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
                    Format
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Prettify JSON with indentation</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleCompress} variant="secondary">
                    Compress
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
                    Copy
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Copy to clipboard</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleClear} variant="ghost" className="variant-ghost">
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent role="tooltip">
                  <p>Clear all fields</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

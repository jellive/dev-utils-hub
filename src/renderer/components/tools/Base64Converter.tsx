import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHistoryAutoSave } from '../../hooks/useHistoryAutoSave';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUp, ArrowDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  setCurrentFeature,
  addInteractionBreadcrumb,
  addConversionBreadcrumb,
  addErrorBreadcrumb,
  FEATURES,
  INTERACTION_TYPES,
  TOOLS,
} from '@/utils/sentryContext';

export function Base64Converter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [encoding, setEncoding] = useState('utf-8');

  // Auto-save to history
  const saveToHistory = useHistoryAutoSave({ tool: 'base64' });

  // Set feature context on mount
  useEffect(() => {
    setCurrentFeature(FEATURES.DATA_CONVERSION);
  }, []);

  // Save to history when output changes
  useEffect(() => {
    if (output && !error) {
      saveToHistory(input, output, { activeTab, urlSafe, encoding });
    }
  }, [output, error, input, activeTab, urlSafe, encoding, saveToHistory]);

  // Calculate human-readable file size
  const formatFileSize = (text: string): string => {
    const bytes = new TextEncoder().encode(text).length;
    if (bytes === 0) return '0 bytes';
    if (bytes === 1) return '1 byte';
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const inputCharCount = input.length;
  const inputSize = formatFileSize(input);
  const outputCharCount = output.length;
  const outputSize = formatFileSize(output);

  // UTF-8 safe Base64 encoding
  const encodeBase64 = (text: string): string => {
    const utf8Bytes = new TextEncoder().encode(text);
    let binary = '';
    utf8Bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    let encoded = btoa(binary);

    // Convert to URL-safe Base64 if enabled
    if (urlSafe) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    return encoded;
  };

  // UTF-8 safe Base64 decoding
  const decodeBase64 = (base64: string): string => {
    let processedBase64 = base64;

    // Convert URL-safe Base64 back to standard if needed
    if (urlSafe) {
      processedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      while (processedBase64.length % 4) {
        processedBase64 += '=';
      }
    }

    const binary = atob(processedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  };

  const handleEncode = () => {
    setError('');

    // Track user interaction
    addInteractionBreadcrumb(
      INTERACTION_TYPES.CLICK,
      'Encode Button',
      { inputLength: input.length, urlSafe, encoding }
    );

    if (!input.trim()) {
      setError('Input is empty. Please enter text to encode.');
      return;
    }

    try {
      const encoded = encodeBase64(input);
      setOutput(encoded);

      // Track successful conversion
      addConversionBreadcrumb(
        TOOLS.BASE64_CONVERTER,
        input.length,
        encoded.length,
        true
      );
    } catch (err) {
      // Track failed conversion
      addConversionBreadcrumb(
        TOOLS.BASE64_CONVERTER,
        input.length,
        0,
        false
      );

      // Add error breadcrumb
      addErrorBreadcrumb(
        'Base64 Encoding Error',
        err instanceof Error ? err.message : 'Unknown error',
        'User attempted to encode invalid input'
      );

      setError('Failed to encode text. Please try again.');
      setOutput('');
    }
  };

  const handleDecode = () => {
    setError('');

    // Track user interaction
    addInteractionBreadcrumb(
      INTERACTION_TYPES.CLICK,
      'Decode Button',
      { inputLength: input.length, urlSafe, encoding }
    );

    if (!input.trim()) {
      setError('Input is empty. Please enter Base64 text to decode.');
      return;
    }

    try {
      const decoded = decodeBase64(input);
      setOutput(decoded);

      // Track successful conversion
      addConversionBreadcrumb(
        TOOLS.BASE64_CONVERTER,
        input.length,
        decoded.length,
        true
      );
    } catch (err) {
      // Track failed conversion
      addConversionBreadcrumb(
        TOOLS.BASE64_CONVERTER,
        input.length,
        0,
        false
      );

      // Add error breadcrumb
      addErrorBreadcrumb(
        'Base64 Decoding Error',
        err instanceof Error ? err.message : 'Unknown error',
        'User attempted to decode invalid Base64'
      );

      setError('Invalid Base64 format. Please check your input.');
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const copyToClipboard = () => {
    if (output) {
      // Track copy action
      addInteractionBreadcrumb(
        INTERACTION_TYPES.COPY,
        'Output Result',
        { outputLength: output.length, mode: activeTab }
      );

      navigator.clipboard.writeText(output);
      toast.success(t('common.copied'));
    }
  };

  const sendToAPITester = () => {
    if (!output) {
      toast.error('No encoded value to send');
      return;
    }

    // If encoding, send as Basic Auth header
    // Format should be "username:password" before encoding
    if (activeTab === 'encode') {
      navigate('/api-tester', {
        state: {
          authType: 'basic',
          basicAuthEncoded: output,
        },
      });
      toast.success('Base64 sent to API Tester for Basic Auth');
    } else {
      // If decoding, just send the decoded value
      navigate('/api-tester', {
        state: {
          body: output,
        },
      });
      toast.success('Decoded value sent to API Tester');
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!e.dataTransfer) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tools.base64.title')}</h2>

      {/* Settings Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          {/* URL-safe Switch */}
          <div className="flex items-center gap-2">
            <Switch
              id="url-safe"
              checked={urlSafe}
              onCheckedChange={setUrlSafe}
            />
            <Label htmlFor="url-safe" className="cursor-pointer">
              {t('tools.base64.urlSafe')}
            </Label>
          </div>

          {/* Encoding Select */}
          <div className="flex items-center gap-2">
            <Label htmlFor="encoding">{t('common.options')}:</Label>
            <Select value={encoding} onValueChange={setEncoding}>
              <SelectTrigger id="encoding" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utf-8">UTF-8</SelectItem>
                <SelectItem value="ascii">ASCII</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="encode" className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            {t('tools.base64.encodeTab')}
          </TabsTrigger>
          <TabsTrigger value="decode" className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4" />
            {t('tools.base64.decodeTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encode" className="space-y-4">
          {/* Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="encode-input">{t('tools.base64.input')}</Label>
              <span className="text-sm text-muted-foreground">
                {inputCharCount} characters ({inputSize})
              </span>
            </div>
            <Textarea
              id="encode-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              placeholder={t('tools.base64.enterText')}
              className="h-32 font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleEncode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.encode')}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.clear')}
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.copy')}
            </button>
            {output && (
              <Button onClick={sendToAPITester} variant="secondary" className="gap-2">
                <Send className="h-4 w-4" />
                Send to API Tester
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="decode" className="space-y-4">
          {/* Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="decode-input">{t('tools.base64.input')}</Label>
              <span className="text-sm text-muted-foreground">
                {inputCharCount} characters ({inputSize})
              </span>
            </div>
            <Textarea
              id="decode-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              placeholder={t('tools.base64.enterBase64')}
              className="h-32 font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDecode}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.decode')}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.clear')}
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.copy')}
            </button>
            {output && (
              <Button onClick={sendToAPITester} variant="secondary" className="gap-2">
                <Send className="h-4 w-4" />
                Send to API Tester
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Output Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="output">{t('tools.base64.output')}</Label>
          {output && (
            <span className="text-sm text-muted-foreground">
              {outputCharCount} characters ({outputSize})
            </span>
          )}
        </div>
        <Textarea
          id="output"
          value={output}
          readOnly
          placeholder={t('tools.base64.output')}
          className="h-32 font-mono bg-muted"
        />
      </div>
    </div>
  );
}

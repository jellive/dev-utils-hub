import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAIProvider, useAIProviderStore } from '@/hooks/useAIProvider';
import { AIProviderSettings } from '../shared/AIProviderSettings';

interface GeneratedSchemas {
  typescript: string;
  zod: string;
  jsonSchema: string;
}

const SYSTEM_PROMPT = `You are a TypeScript/schema expert. Given JSON input, respond ONLY with a JSON object in this exact format:
{
  "typescript": "<TypeScript interface definition>",
  "zod": "<Zod schema definition>",
  "jsonSchema": "<JSON Schema object as a JSON string>"
}
No markdown, no code blocks, no explanation outside the JSON. The jsonSchema value must be a valid JSON string (escape quotes).`;

export function AIJsonSchemaGenerator() {
  const provider = useAIProvider();
  const { providerType, openaiApiKey } = useAIProviderStore();

  const [jsonInput, setJsonInput] = useState('');
  const [schemas, setSchemas] = useState<GeneratedSchemas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isProviderReady =
    providerType === 'ollama' || (providerType === 'openai' && openaiApiKey.length > 0);

  const isValidJson = (): boolean => {
    if (!jsonInput.trim()) return false;
    try {
      JSON.parse(jsonInput);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!isValidJson()) {
      toast.error('Please enter valid JSON first');
      return;
    }
    if (!provider) {
      toast.error('Configure your AI provider first');
      return;
    }

    setLoading(true);
    setError('');
    setSchemas(null);

    try {
      const result = await provider.chat([
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate TypeScript type, Zod schema, and JSON Schema for this JSON:\n\n${jsonInput}`,
        },
      ]);

      const parsed: GeneratedSchemas = JSON.parse(result.trim());
      if (!parsed.typescript || !parsed.zod || !parsed.jsonSchema) {
        throw new Error('Incomplete response from AI');
      }
      setSchemas(parsed);
      toast.success('Schemas generated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setError(msg);
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const formatJsonSchema = (raw: string): string => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI JSON Schema Generator</h2>

      <AIProviderSettings />

      {/* JSON Input */}
      <Card>
        <CardHeader>
          <CardTitle>JSON Input</CardTitle>
          <CardDescription>Paste your JSON — AI will infer the types and schemas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder={'{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com"\n}'}
            className="font-mono min-h-[180px] text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={handleGenerate}
              disabled={loading || !isProviderReady || !jsonInput.trim()}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate Schemas'}
            </Button>
            {jsonInput && !isValidJson() && (
              <span className="text-sm text-red-500">Invalid JSON</span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Output Tabs */}
      {schemas && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Schemas</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="typescript">
              <TabsList className="mb-4">
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                <TabsTrigger value="zod">Zod</TabsTrigger>
                <TabsTrigger value="jsonSchema">JSON Schema</TabsTrigger>
              </TabsList>

              <TabsContent value="typescript">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 gap-1 z-10"
                    onClick={() => handleCopy(schemas.typescript, 'TypeScript')}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <pre className="font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {schemas.typescript}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="zod">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 gap-1 z-10"
                    onClick={() => handleCopy(schemas.zod, 'Zod schema')}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <pre className="font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {schemas.zod}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="jsonSchema">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 gap-1 z-10"
                    onClick={() => handleCopy(formatJsonSchema(schemas.jsonSchema), 'JSON Schema')}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <pre className="font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {formatJsonSchema(schemas.jsonSchema)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Copy, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAIProvider, useAIProviderStore } from '@/hooks/useAIProvider';
import { AIProviderSettings } from '../shared/AIProviderSettings';

type Complexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)' | 'Unknown';

interface ExplanationResult {
  summary: string;
  lineByLine: Array<{ line: string; explanation: string }>;
  complexity: Complexity;
  complexityReason: string;
  suggestions: string[];
}

const LANGUAGES = [
  'Auto-detect',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Rust',
  'Go',
  'C++',
  'Swift',
  'Kotlin',
  'SQL',
] as const;

const SYSTEM_PROMPT = `You are a senior software engineer explaining code. Given code, respond ONLY with JSON in this format:
{
  "summary": "<1-2 sentence overall explanation>",
  "lineByLine": [{"line": "<code line or block>", "explanation": "<what it does>"}],
  "complexity": "<one of: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), Unknown>",
  "complexityReason": "<brief reason for the complexity>",
  "suggestions": ["<improvement suggestion>"]
}
Group related lines into logical blocks. Keep explanations concise. No markdown outside the JSON.`;

const COMPLEXITY_COLORS: Record<string, string> = {
  'O(1)': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'O(log n)': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'O(n)': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'O(n log n)': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'O(n²)': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'O(2ⁿ)': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function AICodeExplainer() {
  const provider = useAIProvider();
  const { providerType, openaiApiKey } = useAIProviderStore();

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<string>('Auto-detect');
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isProviderReady =
    providerType === 'ollama' || (providerType === 'openai' && openaiApiKey.length > 0);

  const handleExplain = async () => {
    if (!code.trim()) {
      toast.error('Please paste some code first');
      return;
    }
    if (!provider) {
      toast.error('Configure your AI provider first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const langHint = language === 'Auto-detect' ? '' : ` (${language})`;

    try {
      const response = await provider.chat([
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Explain this code${langHint}:\n\n${code}`,
        },
      ]);

      const parsed: ExplanationResult = JSON.parse(response.trim());
      if (!parsed.summary || !Array.isArray(parsed.lineByLine)) {
        throw new Error('Invalid response format');
      }
      setResult(parsed);
      toast.success('Explanation ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to explain code';
      setError(msg);
      toast.error('Explanation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const complexityColor = result
    ? (COMPLEXITY_COLORS[result.complexity] ?? COMPLEXITY_COLORS['Unknown'])
    : '';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Code Explainer</h2>

      <AIProviderSettings />

      {/* Code Input */}
      <Card>
        <CardHeader>
          <CardTitle>Code Input</CardTitle>
          <CardDescription>Paste any code — AI will explain it line by line</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 dark:text-gray-400">Language hint</span>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 gap-1 z-10"
              onClick={() => handleCopy(code)}
            >
              <Copy className="h-3 w-3" />
              Copy
            </Button>
            <Textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Paste your code here..."
              className="font-mono text-sm min-h-[200px] pr-20"
            />
          </div>

          <Button
            onClick={handleExplain}
            disabled={loading || !isProviderReady || !code.trim()}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Explaining...' : 'Explain Code'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <>
          {/* Summary + Complexity */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Summary</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{result.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">Complexity</span>
                  </div>
                  <span
                    className={`text-sm font-mono font-semibold px-2 py-0.5 rounded ${complexityColor}`}
                  >
                    {result.complexity}
                  </span>
                  <span className="text-xs text-gray-500 text-right max-w-[160px]">
                    {result.complexityReason}
                  </span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Line-by-line */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line-by-line Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.lineByLine.map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr] gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre">
                    {item.line}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 self-center">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Badge variant="outline" className="shrink-0 h-5 text-xs">
                        {i + 1}
                      </Badge>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Copy, Trash2, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { toast } from 'sonner';
import { useAIProvider, useAIProviderStore } from '@/hooks/useAIProvider';
import { AIProviderSettings } from '../shared/AIProviderSettings';

interface RegexHistory {
  id: string;
  prompt: string;
  pattern: string;
  explanation: string;
  timestamp: number;
}

export function AIRegexBuilder() {
  const provider = useAIProvider();
  const { providerType, openaiApiKey } = useAIProviderStore();

  const [prompt, setPrompt] = useState('');
  const [testInput, setTestInput] = useState('');
  const [generatedPattern, setGeneratedPattern] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<RegexHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const isProviderReady =
    providerType === 'ollama' || (providerType === 'openai' && openaiApiKey.length > 0);

  const getMatches = (): string[] => {
    if (!generatedPattern || !testInput) return [];
    try {
      const regex = new RegExp(generatedPattern, 'g');
      return Array.from(testInput.matchAll(regex)).map(m => m[0]);
    } catch {
      return [];
    }
  };

  const isValidRegex = (): boolean => {
    if (!generatedPattern) return false;
    try {
      new RegExp(generatedPattern);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe the pattern you need');
      return;
    }
    if (!provider) {
      toast.error('Configure your AI provider first');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedPattern('');
    setExplanation('');

    try {
      const result = await provider.chat([
        {
          role: 'system',
          content:
            'You are a regex expert. Given a natural language description, respond with ONLY a JSON object in this exact format: {"pattern": "<regex_pattern>", "explanation": "<brief explanation of how it works>"}. No markdown, no code blocks, just the raw JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const parsed = JSON.parse(result.trim());
      if (!parsed.pattern || !parsed.explanation) throw new Error('Invalid response format');

      setGeneratedPattern(parsed.pattern);
      setExplanation(parsed.explanation);

      const entry: RegexHistory = {
        id: Date.now().toString(),
        prompt,
        pattern: parsed.pattern,
        explanation: parsed.explanation,
        timestamp: Date.now(),
      };
      setHistory(prev => [entry, ...prev].slice(0, 20));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate regex';
      setError(msg);
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const loadFromHistory = (item: RegexHistory) => {
    setPrompt(item.prompt);
    setGeneratedPattern(item.pattern);
    setExplanation(item.explanation);
    setShowHistory(false);
  };

  const matches = getMatches();
  const valid = isValidRegex();

  const highlightMatches = (): React.ReactNode => {
    if (!generatedPattern || !testInput || matches.length === 0) return testInput;
    try {
      const regex = new RegExp(generatedPattern, 'g');
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      for (const match of testInput.matchAll(regex)) {
        if (match.index === undefined) continue;
        if (match.index > lastIndex) {
          parts.push(testInput.slice(lastIndex, match.index));
        }
        parts.push(
          <mark
            key={match.index}
            className="bg-yellow-300 dark:bg-yellow-600 text-gray-900 dark:text-white rounded px-0.5"
          >
            {match[0]}
          </mark>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < testInput.length) parts.push(testInput.slice(lastIndex));
      return parts;
    } catch {
      return testInput;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Regex Builder</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            History ({history.length})
          </Button>
        </div>
      </div>

      <AIProviderSettings />

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {history.map(item => (
              <div
                key={item.id}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => loadFromHistory(item)}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.prompt}
                </p>
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                  /{item.pattern}/
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Pattern</CardTitle>
          <CardDescription>Describe in plain English what you want to match</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Match email addresses, or Korean phone numbers like 010-1234-5678"
            onKeyDown={e => e.key === 'Enter' && !loading && handleGenerate()}
          />
          <Button onClick={handleGenerate} disabled={loading || !isProviderReady} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? 'Generating...' : 'Generate Regex'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated Pattern */}
      {generatedPattern && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Generated Pattern</CardTitle>
                {valid ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">Invalid</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => handleCopy(generatedPattern)}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg break-all">
              /{generatedPattern}/
            </div>
            {explanation && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{explanation}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Test */}
      <Card>
        <CardHeader>
          <CardTitle>Live Test</CardTitle>
          <CardDescription>Paste sample text to test the generated pattern</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="Paste text here to test..."
            className="font-mono min-h-[100px]"
          />
          {testInput && generatedPattern && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Matches:
                </span>
                <Badge variant={matches.length > 0 ? 'default' : 'secondary'}>
                  {matches.length} found
                </Badge>
              </div>
              <div className="font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg whitespace-pre-wrap break-words min-h-[60px]">
                {highlightMatches()}
              </div>
            </div>
          )}
          {testInput && generatedPattern && matches.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Match list:</p>
              <div className="flex flex-wrap gap-2">
                {matches.map((m, i) => (
                  <Badge key={i} variant="outline" className="font-mono text-xs">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedPattern && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setGeneratedPattern('');
            setExplanation('');
            setError('');
          }}
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useAIProviderStore } from '@/hooks/useAIProvider';

export function AIProviderSettings() {
  const [open, setOpen] = useState(false);
  const {
    providerType,
    openaiApiKey,
    ollamaBaseUrl,
    ollamaModel,
    setProviderType,
    setOpenAIApiKey,
    setOllamaBaseUrl,
    setOllamaModel,
  } = useAIProviderStore();

  const isConfigured =
    providerType === 'ollama' || (providerType === 'openai' && openaiApiKey.length > 0);

  return (
    <Card
      className={
        isConfigured
          ? 'border-green-200 dark:border-green-800'
          : 'border-yellow-200 dark:border-yellow-800'
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <CardTitle className="text-sm font-medium">
              AI Provider:{' '}
              <span className="text-primary">
                {providerType === 'openai' ? 'OpenAI' : 'Ollama (local)'}
              </span>
            </CardTitle>
            {!isConfigured && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                — API key required
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 pt-0">
          {/* Provider toggle */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={providerType === 'openai' ? 'default' : 'outline'}
              onClick={() => setProviderType('openai')}
            >
              OpenAI
            </Button>
            <Button
              size="sm"
              variant={providerType === 'ollama' ? 'default' : 'outline'}
              onClick={() => setProviderType('ollama')}
            >
              Ollama (local)
            </Button>
          </div>

          {providerType === 'openai' && (
            <div className="space-y-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">OpenAI API Key</label>
              <Input
                type="password"
                value={openaiApiKey}
                onChange={e => setOpenAIApiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm"
              />
            </div>
          )}

          {providerType === 'ollama' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Ollama Base URL</label>
                <Input
                  value={ollamaBaseUrl}
                  onChange={e => setOllamaBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">Model</label>
                <Input
                  value={ollamaModel}
                  onChange={e => setOllamaModel(e.target.value)}
                  placeholder="llama3.2"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

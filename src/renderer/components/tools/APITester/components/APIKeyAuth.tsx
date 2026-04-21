import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X } from 'lucide-react';

interface APIKeyAuthProps {
  onChange: (config: { key: string; keyName: string; placement: 'header' | 'query' } | null) => void;
}

export function APIKeyAuth({ onChange }: APIKeyAuthProps) {
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('X-API-Key');
  const [placement, setPlacement] = useState<'header' | 'query'>('header');

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value && keyName) {
      onChange({ key: value, keyName, placement });
    } else {
      onChange(null);
    }
  };

  const handleKeyNameChange = (value: string) => {
    setKeyName(value);
    if (apiKey && value) {
      onChange({ key: apiKey, keyName: value, placement });
    }
  };

  const handlePlacementChange = (value: 'header' | 'query') => {
    setPlacement(value);
    if (apiKey && keyName) {
      onChange({ key: apiKey, keyName, placement: value });
    }
  };

  const handleClear = () => {
    setApiKey('');
    onChange(null);
  };

  const getExample = () => {
    if (!apiKey) return null;

    if (placement === 'header') {
      return `${keyName}: ${apiKey}`;
    } else {
      return `?${keyName}=${apiKey}`;
    }
  };

  const example = getExample();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <div className="relative">
          <Input
            id="api-key"
            type="text"
            placeholder="Enter API key"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            className="pr-10"
          />
          {apiKey && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClear}
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="key-name">Key Name</Label>
        <Input
          id="key-name"
          type="text"
          placeholder="Header name (e.g., X-API-Key)"
          value={keyName}
          onChange={(e) => handleKeyNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Add To</Label>
        <RadioGroup value={placement} onValueChange={handlePlacementChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="header" id="header" />
            <Label htmlFor="header" className="font-normal cursor-pointer">
              Header
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="query" id="query" />
            <Label htmlFor="query" className="font-normal cursor-pointer">
              Query Parameter
            </Label>
          </div>
        </RadioGroup>
      </div>

      {example && (
        <div className="space-y-2">
          <Label>Example</Label>
          <div className="rounded-md border bg-muted p-3 font-mono text-sm break-all">
            {example}
          </div>
        </div>
      )}
    </div>
  );
}

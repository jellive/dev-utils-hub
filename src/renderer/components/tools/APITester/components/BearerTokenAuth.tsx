import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, X } from 'lucide-react';

interface BearerTokenAuthProps {
  onChange: (token: string) => void;
}

export function BearerTokenAuth({ onChange }: BearerTokenAuthProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const validateJWTFormat = (value: string): boolean => {
    if (!value) {
      setError('');
      return true;
    }

    // JWT format: header.payload.signature (3 parts separated by dots)
    const parts = value.split('.');
    if (parts.length !== 3) {
      setError('Invalid token format: JWT must have 3 parts (header.payload.signature)');
      return false;
    }

    setError('');
    return true;
  };

  const handleTokenChange = (value: string) => {
    setToken(value);
    onChange(value);

    // Clear error while typing
    if (error) {
      setError('');
    }
  };

  const handleBlur = () => {
    validateJWTFormat(token);
  };

  const handleClear = () => {
    setToken('');
    onChange('');
    setError('');
  };

  const handleCopy = async () => {
    const header = `Bearer ${token}`;
    await navigator.clipboard.writeText(header);
  };

  const isValidToken = token && !error && token.split('.').length === 3;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bearer-token">Bearer Token</Label>
        <div className="relative">
          <Input
            id="bearer-token"
            type="text"
            placeholder="Enter bearer token (e.g., JWT)"
            value={token}
            onChange={(e) => handleTokenChange(e.target.value)}
            onBlur={handleBlur}
            className={error ? 'border-red-500 pr-10' : 'pr-10'}
          />
          {token && (
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
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!isValidToken}
          aria-label="Decode Token"
        >
          Decode Token
        </Button>
      </div>

      {token && (
        <div className="space-y-2">
          <Label>Authorization Header</Label>
          <div className="relative">
            <div className="rounded-md border bg-muted p-3 pr-12 font-mono text-sm">
              Bearer {token}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleCopy}
              aria-label="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

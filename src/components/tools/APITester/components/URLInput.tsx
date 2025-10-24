import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function URLInput({ value, onChange }: URLInputProps) {
  const [error, setError] = useState<string>('');
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const validateURL = (url: string): boolean => {
    if (!url) {
      setError('');
      return true;
    }

    // Check if URL has protocol
    const hasProtocol = /^https?:\/\//i.test(url);

    if (!hasProtocol) {
      setError('Invalid URL: must start with http:// or https://');
      return false;
    }

    // Basic URL validation
    try {
      new URL(url);
      setError('');
      return true;
    } catch {
      setError('Invalid URL format');
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);

    // Clear error while typing
    if (error) {
      setError('');
    }
  };

  const handleBlur = () => {
    if (!localValue) {
      setError('');
      return;
    }

    // Auto-prepend https:// if no protocol
    if (localValue && !/^https?:\/\//i.test(localValue)) {
      const withProtocol = `https://${localValue}`;
      setLocalValue(withProtocol);
      onChange(withProtocol);
      validateURL(withProtocol);
    } else {
      validateURL(localValue);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setError('');
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="relative">
        <Input
          type="url"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter API endpoint (e.g., https://api.example.com/users)"
          className={error ? 'border-red-500 pr-10' : 'pr-10'}
        />
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={handleClear}
            aria-label="Clear URL"
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
  );
}

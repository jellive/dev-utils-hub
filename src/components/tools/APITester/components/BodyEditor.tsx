import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BodyEditor({ value, onChange }: BodyEditorProps) {
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Clear error when user is typing
    if (error) {
      setError('');
    }
  };

  const handleFormat = () => {
    // Handle empty input gracefully
    if (!value.trim()) {
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setError('');
    } catch (e) {
      setError('Invalid JSON: Unable to parse');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="body-editor">Request Body</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFormat}
          type="button"
        >
          Format
        </Button>
      </div>

      <Textarea
        id="body-editor"
        value={value}
        onChange={handleChange}
        placeholder="Enter request body (JSON)"
        className="font-mono min-h-[200px]"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

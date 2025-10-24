import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type BodyType = 'json' | 'text' | 'form-data';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const JSON_TEMPLATES = {
  user: {
    name: 'User Object',
    template: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    }
  },
  array: {
    name: 'Array of Items',
    template: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  },
  nested: {
    name: 'Nested Object',
    template: {
      user: {
        profile: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        settings: {
          notifications: true,
          theme: 'dark'
        }
      }
    }
  }
};

export function BodyEditor({ value, onChange }: BodyEditorProps) {
  const [error, setError] = useState<string>('');
  const [bodyType, setBodyType] = useState<BodyType>('json');

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

  const handleBodyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as BodyType;
    setBodyType(newType);
    setError('');
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateKey = e.target.value;
    if (!templateKey) return;

    const template = JSON_TEMPLATES[templateKey as keyof typeof JSON_TEMPLATES];
    if (template) {
      const formatted = JSON.stringify(template.template, null, 2);
      onChange(formatted);
    }

    // Reset select to placeholder
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="body-type">Body Type</Label>
          <select
            id="body-type"
            value={bodyType}
            onChange={handleBodyTypeChange}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Body Type"
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="form-data">Form Data</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {bodyType === 'json' && (
            <>
              <select
                onChange={handleTemplateChange}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Template"
                defaultValue=""
              >
                <option value="">Select template...</option>
                {Object.entries(JSON_TEMPLATES).map(([key, { name }]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleFormat}
                type="button"
              >
                Format
              </Button>
            </>
          )}
        </div>
      </div>

      <Textarea
        id="body-editor"
        value={value}
        onChange={handleChange}
        placeholder={
          bodyType === 'json'
            ? 'Enter request body (JSON)'
            : bodyType === 'text'
            ? 'Enter plain text body'
            : 'Enter form data'
        }
        className="font-mono min-h-[200px]"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

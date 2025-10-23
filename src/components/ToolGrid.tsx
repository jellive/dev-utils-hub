import { useState } from 'react';
import {
  FileJson,
  Key,
  FileCode,
  Link,
  Regex,
  FileDiff,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useAppStore } from '../stores/useAppStore';
import type { ToolType } from '../types';

interface ToolConfig {
  id: ToolType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tools: ToolConfig[] = [
  {
    id: 'json',
    name: 'JSON Formatter',
    description: 'Format, validate, and compress JSON data',
    icon: FileJson,
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    description: 'Decode and verify JWT tokens',
    icon: Key,
  },
  {
    id: 'base64',
    name: 'Base64 Converter',
    description: 'Encode and decode Base64 data',
    icon: FileCode,
  },
  {
    id: 'url',
    name: 'URL Encoder/Decoder',
    description: 'Encode and decode URL parameters',
    icon: Link,
  },
  {
    id: 'regex',
    name: 'Regex Tester',
    description: 'Test and debug regular expressions',
    icon: Regex,
  },
  {
    id: 'diff',
    name: 'Text Diff',
    description: 'Compare and highlight text differences',
    icon: FileDiff,
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256 hashes',
    icon: Hash,
  },
];

export function ToolGrid() {
  const { activeTool, setActiveTool } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Tool Grid */}
      <div
        role="grid"
        aria-label="Tool Selection Grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              aria-label={tool.name}
              className={`
                group text-left transition-all duration-300 ease-out
                hover:-translate-y-2 hover:shadow-xl
                active:scale-[0.98] active:shadow-md
                ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}
              `}
            >
              <Card className={`h-full transition-all duration-300 ${isActive ? 'border-primary bg-primary/5' : 'group-hover:border-primary/50'}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {/* No Results */}
      {filteredTools.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tools found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FileJson,
  Key,
  FileCode,
  Link,
  Regex,
  FileDiff,
  Hash,
  Fingerprint,
  Calendar,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useTranslation } from 'react-i18next';
import type { ToolType } from '../types';

interface ToolConfig {
  id: ToolType;
  icon: React.ComponentType<{ className?: string }>;
}

const tools: ToolConfig[] = [
  { id: 'json', icon: FileJson },
  { id: 'jwt', icon: Key },
  { id: 'base64', icon: FileCode },
  { id: 'url', icon: Link },
  { id: 'regex', icon: Regex },
  { id: 'diff', icon: FileDiff },
  { id: 'hash', icon: Hash },
  { id: 'uuid', icon: Fingerprint },
  { id: 'timestamp', icon: Calendar },
  { id: 'api', icon: Send },
];

export function ToolGrid() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = tools.filter((tool) => {
    const name = t(`tools.${tool.id}.name`);
    const description = t(`tools.${tool.id}.description`);
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder={t('common.search')}
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
          const isActive = location.pathname === `/${tool.id}`;
          const name = t(`tools.${tool.id}.name`);
          const description = t(`tools.${tool.id}.description`);

          return (
            <RouterLink
              key={tool.id}
              to={`/${tool.id}`}
              aria-label={name}
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
                    <CardTitle className="text-lg">{name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </RouterLink>
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

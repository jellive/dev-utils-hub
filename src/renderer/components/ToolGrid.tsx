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
  Palette,
  Clock,
  FileText,
  Ruler,
  Sparkles,
  Braces,
  BookOpenText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useTranslation } from 'react-i18next';
import { pluginRegistry } from '../../lib/plugins/plugin-registry';

// Map icon name strings (stored in plugin manifests) to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  FileJson,
  Key,
  FileCode,
  Link,
  Regex,
  FileDiff,
  Hash,
  Fingerprint,
  Calendar,
  Palette,
  Clock,
  FileText,
  Ruler,
  Sparkles,
  Braces,
  BookOpenText,
};

export function ToolGrid() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const allPlugins = pluginRegistry.getEnabledPlugins();

  const filteredPlugins = allPlugins.filter(plugin => {
    // Fall back to plugin metadata when translation key is missing
    const name = t(`tools.${plugin.id}.name`, { defaultValue: plugin.name });
    const description = t(`tools.${plugin.id}.description`, {
      defaultValue: plugin.description,
    });
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
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Tool Grid */}
      <div
        role="grid"
        aria-label="Tool Selection Grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filteredPlugins.map(plugin => {
          const Icon = ICON_MAP[plugin.icon] ?? FileJson;
          const routePath = plugin.path ?? plugin.id;
          const isActive = location.pathname === `/${routePath}`;
          const name = t(`tools.${plugin.id}.name`, { defaultValue: plugin.name });
          const description = t(`tools.${plugin.id}.description`, {
            defaultValue: plugin.description,
          });

          return (
            <RouterLink
              key={plugin.id}
              to={`/${routePath}`}
              aria-label={name}
              className={`
                group text-left transition-all duration-300 ease-out
                hover:-translate-y-2 hover:shadow-xl
                active:scale-[0.98] active:shadow-md
                ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}
              `}
            >
              <Card
                className={`h-full transition-all duration-300 ${isActive ? 'border-primary bg-primary/5' : 'group-hover:border-primary/50'}`}
              >
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
      {filteredPlugins.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tools found matching &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

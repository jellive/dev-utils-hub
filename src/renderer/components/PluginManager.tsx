import { useState } from 'react';
import { Package, ToggleLeft, ToggleRight, Info, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { pluginRegistry } from '../../lib/plugins/plugin-registry';
import type { DevUtilPlugin } from '../../lib/plugins/plugin-types';

export function PluginManager() {
  const [plugins, setPlugins] = useState<DevUtilPlugin[]>(() => pluginRegistry.getAllPlugins());

  const handleToggle = (pluginId: string) => {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (!plugin || plugin.builtin) return;
    pluginRegistry.setEnabled(pluginId, !plugin.enabled);
    setPlugins(pluginRegistry.getAllPlugins());
  };

  const builtins = plugins.filter(p => p.builtin);
  const custom = plugins.filter(p => !p.builtin);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Plugin Manager</h1>
      </div>

      {/* Custom plugins section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Custom Plugins</h2>
          <Button variant="outline" size="sm" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Load Plugin (coming soon)
          </Button>
        </div>

        {custom.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No custom plugins installed. Load a plugin to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {custom.map(plugin => (
              <PluginRow key={plugin.id} plugin={plugin} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </section>

      {/* Built-in tools section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Built-in Tools</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {builtins.length} tools
          </span>
        </div>
        <div className="grid gap-3">
          {builtins.map(plugin => (
            <PluginRow key={plugin.id} plugin={plugin} onToggle={handleToggle} />
          ))}
        </div>
      </section>
    </div>
  );
}

interface PluginRowProps {
  plugin: DevUtilPlugin;
  onToggle: (id: string) => void;
}

function PluginRow({ plugin, onToggle }: PluginRowProps) {
  const isEnabled = plugin.enabled !== false;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{plugin.name}</CardTitle>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
              {plugin.category}
            </span>
            {plugin.builtin && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                built-in
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onToggle(plugin.id)}
            disabled={plugin.builtin}
            title={
              plugin.builtin
                ? 'Built-in tools cannot be disabled'
                : isEnabled
                  ? 'Disable'
                  : 'Enable'
            }
            className="disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEnabled ? (
              <ToggleRight className="h-6 w-6 text-primary" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="flex items-start gap-2">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          <span>
            {plugin.description} &middot; v{plugin.version} &middot; by {plugin.author}
          </span>
        </CardDescription>
      </CardContent>
    </Card>
  );
}

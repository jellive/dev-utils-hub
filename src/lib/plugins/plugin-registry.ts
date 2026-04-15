import type { DevUtilPlugin, PluginCategory } from './plugin-types';

class PluginRegistry {
  private plugins: Map<string, DevUtilPlugin> = new Map();

  register(plugin: DevUtilPlugin): void {
    this.plugins.set(plugin.id, { enabled: true, ...plugin });
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
  }

  getPlugin(id: string): DevUtilPlugin | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): DevUtilPlugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): DevUtilPlugin[] {
    return this.getAllPlugins().filter(p => p.enabled !== false);
  }

  getByCategory(category: PluginCategory | string): DevUtilPlugin[] {
    return this.getAllPlugins().filter(p => p.category === category);
  }

  setEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.set(pluginId, { ...plugin, enabled });
    }
  }
}

export const pluginRegistry = new PluginRegistry();

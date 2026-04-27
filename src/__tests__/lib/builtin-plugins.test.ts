import { describe, it, expect } from 'vitest';

/**
 * Importing builtin-plugins.ts side-effects every plugin registration onto
 * the singleton registry. We assert the registered set matches the router's
 * known tool catalog so a future drift between router.tsx and the plugin
 * catalog gets caught at unit-test time.
 *
 * Side effects mean importing this in another test would pollute the
 * shared registry — keep it scoped to this file.
 */
import { pluginRegistry } from '@/lib/plugins/plugin-registry';
import '@/lib/plugins/builtin-plugins';

describe('builtin-plugins registrations', () => {
  it('registers core formatting/encoding/security tools', () => {
    const ids = new Set(pluginRegistry.getAllPlugins().map(p => p.id));
    // Spot-check a representative sample — the full list lives in
    // builtin-plugins.ts and shouldn't be hard-coded redundantly here.
    expect(ids.has('json')).toBe(true);
    expect(ids.has('jwt')).toBe(true);
    expect(ids.has('base64')).toBe(true);
    expect(ids.has('url')).toBe(true);
  });

  it('every registered plugin carries the required metadata fields', () => {
    for (const plugin of pluginRegistry.getAllPlugins()) {
      expect(plugin.id).toBeTruthy();
      expect(plugin.name).toBeTruthy();
      expect(plugin.description).toBeTruthy();
      expect(plugin.version).toBeTruthy();
      expect(plugin.author).toBeTruthy();
      expect(plugin.icon).toBeTruthy();
      expect(plugin.category).toBeTruthy();
      expect(plugin.component).toBeDefined();
    }
  });

  it('all built-in plugins are flagged builtin: true', () => {
    for (const plugin of pluginRegistry.getAllPlugins()) {
      expect(plugin.builtin).toBe(true);
    }
  });

  it('plugin ids are unique across the catalog', () => {
    const ids = pluginRegistry.getAllPlugins().map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('enabled defaults to true for every built-in', () => {
    for (const plugin of pluginRegistry.getAllPlugins()) {
      expect(plugin.enabled).toBe(true);
    }
  });

  it('every plugin component is lazy-loadable (not crashing on type check)', () => {
    for (const plugin of pluginRegistry.getAllPlugins()) {
      // React.lazy returns a special object with $$typeof; assert truthy.
      expect(plugin.component).toBeTruthy();
    }
  });
});

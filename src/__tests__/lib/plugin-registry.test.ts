import { describe, it, expect, beforeEach } from 'vitest';
import { pluginRegistry } from '@/lib/plugins/plugin-registry';
import type { DevUtilPlugin } from '@/lib/plugins/plugin-types';

function makePlugin(overrides: Partial<DevUtilPlugin> = {}): DevUtilPlugin {
  return {
    id: 'test-plugin',
    name: 'Test',
    description: 'desc',
    version: '1.0.0',
    author: 'me',
    icon: 'Wrench',
    category: 'utility',
    builtin: false,
    component: (() => null) as unknown as DevUtilPlugin['component'],
    ...overrides,
  };
}

beforeEach(() => {
  // Wipe registry between tests so test order doesn't leak.
  for (const p of pluginRegistry.getAllPlugins()) {
    pluginRegistry.unregister(p.id);
  }
});

describe('PluginRegistry — register / unregister', () => {
  it('registers a plugin and retrieves it by id', () => {
    pluginRegistry.register(makePlugin({ id: 'p1' }));
    expect(pluginRegistry.getPlugin('p1')?.id).toBe('p1');
  });

  it('defaults `enabled` to true when not specified', () => {
    pluginRegistry.register(makePlugin({ id: 'p1' }));
    expect(pluginRegistry.getPlugin('p1')?.enabled).toBe(true);
  });

  it('preserves `enabled: false` when explicitly disabled at register time', () => {
    pluginRegistry.register(makePlugin({ id: 'p1', enabled: false }));
    expect(pluginRegistry.getPlugin('p1')?.enabled).toBe(false);
  });

  it('overwrites a previous registration with the same id', () => {
    pluginRegistry.register(makePlugin({ id: 'p1', name: 'First' }));
    pluginRegistry.register(makePlugin({ id: 'p1', name: 'Second' }));
    expect(pluginRegistry.getPlugin('p1')?.name).toBe('Second');
  });

  it('unregister removes the plugin completely', () => {
    pluginRegistry.register(makePlugin({ id: 'p1' }));
    pluginRegistry.unregister('p1');
    expect(pluginRegistry.getPlugin('p1')).toBeUndefined();
  });

  it('unregister of unknown id is a no-op', () => {
    expect(() => pluginRegistry.unregister('does-not-exist')).not.toThrow();
  });

  it('getPlugin returns undefined for unknown id', () => {
    expect(pluginRegistry.getPlugin('missing')).toBeUndefined();
  });
});

describe('PluginRegistry — listing', () => {
  it('getAllPlugins returns every registered plugin', () => {
    pluginRegistry.register(makePlugin({ id: 'p1' }));
    pluginRegistry.register(makePlugin({ id: 'p2' }));
    pluginRegistry.register(makePlugin({ id: 'p3' }));
    expect(
      pluginRegistry
        .getAllPlugins()
        .map(p => p.id)
        .sort()
    ).toEqual(['p1', 'p2', 'p3']);
  });

  it('getEnabledPlugins filters out disabled entries', () => {
    pluginRegistry.register(makePlugin({ id: 'on', enabled: true }));
    pluginRegistry.register(makePlugin({ id: 'off', enabled: false }));
    pluginRegistry.register(makePlugin({ id: 'default-on' }));
    const enabled = pluginRegistry
      .getEnabledPlugins()
      .map(p => p.id)
      .sort();
    expect(enabled).toEqual(['default-on', 'on']);
  });

  it('getByCategory matches the category field', () => {
    pluginRegistry.register(makePlugin({ id: 'a', category: 'formatting' }));
    pluginRegistry.register(makePlugin({ id: 'b', category: 'security' }));
    pluginRegistry.register(makePlugin({ id: 'c', category: 'formatting' }));
    const formatting = pluginRegistry
      .getByCategory('formatting')
      .map(p => p.id)
      .sort();
    expect(formatting).toEqual(['a', 'c']);
  });

  it('getByCategory returns [] when nothing matches', () => {
    pluginRegistry.register(makePlugin({ id: 'a', category: 'utility' }));
    expect(pluginRegistry.getByCategory('security')).toEqual([]);
  });
});

describe('PluginRegistry — setEnabled', () => {
  it('flips enabled true → false', () => {
    pluginRegistry.register(makePlugin({ id: 'p1' }));
    pluginRegistry.setEnabled('p1', false);
    expect(pluginRegistry.getPlugin('p1')?.enabled).toBe(false);
    expect(pluginRegistry.getEnabledPlugins().some(p => p.id === 'p1')).toBe(false);
  });

  it('flips enabled false → true', () => {
    pluginRegistry.register(makePlugin({ id: 'p1', enabled: false }));
    pluginRegistry.setEnabled('p1', true);
    expect(pluginRegistry.getPlugin('p1')?.enabled).toBe(true);
  });

  it('is a no-op for unknown plugin id (does not crash)', () => {
    expect(() => pluginRegistry.setEnabled('missing', true)).not.toThrow();
    expect(pluginRegistry.getPlugin('missing')).toBeUndefined();
  });
});

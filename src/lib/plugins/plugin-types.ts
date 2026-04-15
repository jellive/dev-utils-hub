import type React from 'react';

export type PluginCategory =
  | 'encoding'
  | 'formatting'
  | 'conversion'
  | 'ai'
  | 'security'
  | 'custom';

export interface DevUtilPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string; // Lucide icon name
  category: PluginCategory;
  component: React.LazyExoticComponent<React.ComponentType>;
  /** Route path under which this plugin is rendered (defaults to id) */
  path?: string;
  /** Whether the plugin is currently enabled */
  enabled?: boolean;
  /** Whether this is a built-in tool (not removable by user) */
  builtin?: boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  category: string;
  entryPoint: string; // path to component
}

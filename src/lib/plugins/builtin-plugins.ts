import { lazy } from 'react';
import { pluginRegistry } from './plugin-registry';

// Built-in tool registrations — mirrors router.tsx lazy imports
pluginRegistry.register({
  id: 'json',
  name: 'JSON Formatter',
  description: 'Format and validate JSON',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'FileJson',
  category: 'formatting',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/JsonFormatter').then(m => ({
      default: m.JsonFormatterRoute,
    }))
  ),
});

pluginRegistry.register({
  id: 'jwt',
  name: 'JWT Decoder',
  description: 'Decode and inspect JWT tokens',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Key',
  category: 'security',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/JwtDecoder').then(m => ({
      default: m.JwtDecoder,
    }))
  ),
});

pluginRegistry.register({
  id: 'base64',
  name: 'Base64 Converter',
  description: 'Encode and decode Base64',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'FileCode',
  category: 'encoding',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/Base64Converter').then(m => ({
      default: m.Base64Converter,
    }))
  ),
});

pluginRegistry.register({
  id: 'url',
  name: 'URL Encoder',
  description: 'Encode and decode URLs',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Link',
  category: 'encoding',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/URLConverter').then(m => ({
      default: m.URLConverter,
    }))
  ),
});

pluginRegistry.register({
  id: 'regex',
  name: 'Regex Tester',
  description: 'Test regular expressions',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Regex',
  category: 'custom',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/RegexTester').then(m => ({
      default: m.RegexTester,
    }))
  ),
});

pluginRegistry.register({
  id: 'diff',
  name: 'Text Diff',
  description: 'Compare two text blocks',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'FileDiff',
  category: 'formatting',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/TextDiff').then(m => ({
      default: m.TextDiff,
    }))
  ),
});

pluginRegistry.register({
  id: 'hash',
  name: 'Hash Generator',
  description: 'Generate cryptographic hashes',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Hash',
  category: 'security',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/HashGenerator').then(m => ({
      default: m.HashGenerator,
    }))
  ),
});

pluginRegistry.register({
  id: 'uuid',
  name: 'UUID Generator',
  description: 'Generate UUIDs',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Fingerprint',
  category: 'custom',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/UUIDGenerator').then(m => ({
      default: m.UUIDGenerator,
    }))
  ),
});

pluginRegistry.register({
  id: 'timestamp',
  name: 'Timestamp Converter',
  description: 'Convert Unix timestamps',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Calendar',
  category: 'conversion',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/TimestampConverter').then(m => ({
      default: m.TimestampConverter,
    }))
  ),
});

pluginRegistry.register({
  id: 'color-picker',
  name: 'Color Picker',
  description: 'Pick and convert colors',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Palette',
  category: 'conversion',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/ColorPicker').then(m => ({
      default: m.ColorPicker,
    }))
  ),
});

pluginRegistry.register({
  id: 'cron-parser',
  name: 'Cron Parser',
  description: 'Parse and explain cron expressions',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Clock',
  category: 'custom',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/CronParser').then(m => ({
      default: m.CronParser,
    }))
  ),
});

pluginRegistry.register({
  id: 'markdown-preview',
  name: 'Markdown Preview',
  description: 'Preview Markdown in real time',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'FileText',
  category: 'formatting',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/MarkdownPreview').then(m => ({
      default: m.MarkdownPreview,
    }))
  ),
});

pluginRegistry.register({
  id: 'css-converter',
  name: 'CSS Unit Converter',
  description: 'Convert CSS units (px, rem, em)',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Ruler',
  category: 'conversion',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/CssUnitConverter').then(m => ({
      default: m.CssUnitConverter,
    }))
  ),
});

pluginRegistry.register({
  id: 'ai-regex',
  name: 'AI Regex Builder',
  description: 'Generate regex with AI',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Sparkles',
  category: 'ai',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/AIRegexBuilder').then(m => ({
      default: m.AIRegexBuilder,
    }))
  ),
});

pluginRegistry.register({
  id: 'ai-json-schema',
  name: 'AI JSON Schema',
  description: 'Generate JSON schemas with AI',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'Braces',
  category: 'ai',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/AIJsonSchemaGenerator').then(m => ({
      default: m.AIJsonSchemaGenerator,
    }))
  ),
});

pluginRegistry.register({
  id: 'ai-code-explainer',
  name: 'AI Code Explainer',
  description: 'Explain code with AI',
  version: '1.0.0',
  author: 'Dev Utils Hub',
  icon: 'BookOpenText',
  category: 'ai',
  builtin: true,
  component: lazy(() =>
    import('../../renderer/components/tools/AICodeExplainer').then(m => ({
      default: m.AICodeExplainer,
    }))
  ),
});

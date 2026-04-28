import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SingleColumnSkeleton } from './components/SingleColumnSkeleton';
import { TwoColumnSkeleton } from './components/TwoColumnSkeleton';

// Bootstrap plugin registry before any routes render
import '../lib/plugins/builtin-plugins';

// Lazy load tool components for code splitting
const JsonFormatter = lazy(() =>
  import('./components/tools/JsonFormatter').then(module => ({
    default: module.JsonFormatterRoute,
  }))
);
const JwtDecoder = lazy(() =>
  import('./components/tools/JwtDecoder').then(module => ({ default: module.JwtDecoder }))
);
const Base64Converter = lazy(() =>
  import('./components/tools/Base64Converter').then(module => ({ default: module.Base64Converter }))
);
const URLConverter = lazy(() =>
  import('./components/tools/URLConverter').then(module => ({ default: module.URLConverter }))
);
const RegexTester = lazy(() =>
  import('./components/tools/RegexTester').then(module => ({ default: module.RegexTester }))
);
const TextDiff = lazy(() =>
  import('./components/tools/TextDiff').then(module => ({ default: module.TextDiff }))
);
const HashGenerator = lazy(() =>
  import('./components/tools/HashGenerator').then(module => ({ default: module.HashGenerator }))
);
const UUIDGenerator = lazy(() =>
  import('./components/tools/UUIDGenerator').then(module => ({ default: module.UUIDGenerator }))
);
const TimestampConverter = lazy(() =>
  import('./components/tools/TimestampConverter').then(module => ({
    default: module.TimestampConverter,
  }))
);
const ToolGrid = lazy(() =>
  import('./components/ToolGrid').then(module => ({ default: module.ToolGrid }))
);
const ColorPicker = lazy(() =>
  import('./components/tools/ColorPicker').then(module => ({ default: module.ColorPicker }))
);
const CronParser = lazy(() =>
  import('./components/tools/CronParser').then(module => ({ default: module.CronParser }))
);
const CronBuilder = lazy(() =>
  import('./components/tools/CronBuilder').then(module => ({ default: module.CronBuilder }))
);
const MarkdownPreview = lazy(() =>
  import('./components/tools/MarkdownPreview').then(module => ({ default: module.MarkdownPreview }))
);
const CssUnitConverter = lazy(() =>
  import('./components/tools/CssUnitConverter').then(module => ({
    default: module.CssUnitConverter,
  }))
);
const AIRegexBuilder = lazy(() =>
  import('./components/tools/AIRegexBuilder').then(module => ({
    default: module.AIRegexBuilder,
  }))
);
const AIJsonSchemaGenerator = lazy(() =>
  import('./components/tools/AIJsonSchemaGenerator').then(module => ({
    default: module.AIJsonSchemaGenerator,
  }))
);
const AICodeExplainer = lazy(() =>
  import('./components/tools/AICodeExplainer').then(module => ({
    default: module.AICodeExplainer,
  }))
);
const WasmBenchmark = lazy(() =>
  import('./components/tools/WasmBenchmark/WasmBenchmark').then(module => ({
    default: module.WasmBenchmark,
  }))
);
const DiffViewer = lazy(() =>
  import('./components/tools/DiffViewer/DiffViewer').then(module => ({
    default: module.DiffViewer,
  }))
);
const PluginManager = lazy(() =>
  import('./components/PluginManager').then(module => ({ default: module.PluginManager }))
);

// Helper components for Suspense with appropriate skeletons
// eslint-disable-next-line react-refresh/only-export-components
const SingleColumnTool = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SingleColumnSkeleton />}>{children}</Suspense>
);

// eslint-disable-next-line react-refresh/only-export-components
const TwoColumnTool = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<TwoColumnSkeleton />}>{children}</Suspense>
);

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<SingleColumnSkeleton />}>
            <ToolGrid />
          </Suspense>
        ),
      },
      {
        path: 'json',
        element: (
          <SingleColumnTool>
            <JsonFormatter />
          </SingleColumnTool>
        ),
      },
      {
        path: 'jwt',
        element: (
          <SingleColumnTool>
            <JwtDecoder />
          </SingleColumnTool>
        ),
      },
      {
        path: 'base64',
        element: (
          <SingleColumnTool>
            <Base64Converter />
          </SingleColumnTool>
        ),
      },
      {
        path: 'url',
        element: (
          <SingleColumnTool>
            <URLConverter />
          </SingleColumnTool>
        ),
      },
      {
        path: 'regex',
        element: (
          <SingleColumnTool>
            <RegexTester />
          </SingleColumnTool>
        ),
      },
      {
        path: 'diff',
        element: (
          <TwoColumnTool>
            <TextDiff />
          </TwoColumnTool>
        ),
      },
      {
        path: 'hash',
        element: (
          <SingleColumnTool>
            <HashGenerator />
          </SingleColumnTool>
        ),
      },
      {
        path: 'uuid',
        element: (
          <SingleColumnTool>
            <UUIDGenerator />
          </SingleColumnTool>
        ),
      },
      {
        path: 'timestamp',
        element: (
          <TwoColumnTool>
            <TimestampConverter />
          </TwoColumnTool>
        ),
      },
      {
        path: 'color-picker',
        element: (
          <SingleColumnTool>
            <ColorPicker />
          </SingleColumnTool>
        ),
      },
      {
        path: 'cron-parser',
        element: (
          <SingleColumnTool>
            <CronParser />
          </SingleColumnTool>
        ),
      },
      {
        path: 'cron-builder',
        element: (
          <SingleColumnTool>
            <CronBuilder />
          </SingleColumnTool>
        ),
      },
      {
        path: 'markdown-preview',
        element: (
          <TwoColumnTool>
            <MarkdownPreview />
          </TwoColumnTool>
        ),
      },
      {
        path: 'css-converter',
        element: (
          <SingleColumnTool>
            <CssUnitConverter />
          </SingleColumnTool>
        ),
      },
      {
        path: 'ai-regex',
        element: (
          <SingleColumnTool>
            <AIRegexBuilder />
          </SingleColumnTool>
        ),
      },
      {
        path: 'ai-json-schema',
        element: (
          <SingleColumnTool>
            <AIJsonSchemaGenerator />
          </SingleColumnTool>
        ),
      },
      {
        path: 'ai-code-explainer',
        element: (
          <SingleColumnTool>
            <AICodeExplainer />
          </SingleColumnTool>
        ),
      },
      {
        path: 'wasm-benchmark',
        element: (
          <SingleColumnTool>
            <WasmBenchmark />
          </SingleColumnTool>
        ),
      },
      {
        path: 'diff-viewer',
        element: (
          <TwoColumnTool>
            <DiffViewer />
          </TwoColumnTool>
        ),
      },
      {
        path: 'plugins',
        element: (
          <SingleColumnTool>
            <PluginManager />
          </SingleColumnTool>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SingleColumnSkeleton } from './components/SingleColumnSkeleton';
import { TwoColumnSkeleton } from './components/TwoColumnSkeleton';

// Lazy load tool components for code splitting
const JsonFormatter = lazy(() =>
  import('./components/tools/JsonFormatter').then((module) => ({ default: module.JsonFormatter }))
);
const JwtDecoder = lazy(() =>
  import('./components/tools/JwtDecoder').then((module) => ({ default: module.JwtDecoder }))
);
const Base64Converter = lazy(() =>
  import('./components/tools/Base64Converter').then((module) => ({ default: module.Base64Converter }))
);
const URLConverter = lazy(() =>
  import('./components/tools/URLConverter').then((module) => ({ default: module.URLConverter }))
);
const RegexTester = lazy(() =>
  import('./components/tools/RegexTester').then((module) => ({ default: module.RegexTester }))
);
const TextDiff = lazy(() =>
  import('./components/tools/TextDiff').then((module) => ({ default: module.TextDiff }))
);
const HashGenerator = lazy(() =>
  import('./components/tools/HashGenerator').then((module) => ({ default: module.HashGenerator }))
);
const UUIDGenerator = lazy(() =>
  import('./components/tools/UUIDGenerator').then((module) => ({ default: module.UUIDGenerator }))
);
const TimestampConverter = lazy(() =>
  import('./components/tools/TimestampConverter').then((module) => ({ default: module.TimestampConverter }))
);
const ToolGrid = lazy(() =>
  import('./components/ToolGrid').then((module) => ({ default: module.ToolGrid }))
);
const APITester = lazy(() =>
  import('./components/tools/APITester').then((module) => ({ default: module.APITester }))
);

// Helper components for Suspense with appropriate skeletons
const SingleColumnTool = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<SingleColumnSkeleton />}>{children}</Suspense>
);

const TwoColumnTool = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<TwoColumnSkeleton />}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<SingleColumnSkeleton />}><ToolGrid /></Suspense>,
      },
      {
        path: 'json',
        element: <SingleColumnTool><JsonFormatter /></SingleColumnTool>,
      },
      {
        path: 'jwt',
        element: <SingleColumnTool><JwtDecoder /></SingleColumnTool>,
      },
      {
        path: 'base64',
        element: <SingleColumnTool><Base64Converter /></SingleColumnTool>,
      },
      {
        path: 'url',
        element: <SingleColumnTool><URLConverter /></SingleColumnTool>,
      },
      {
        path: 'regex',
        element: <SingleColumnTool><RegexTester /></SingleColumnTool>,
      },
      {
        path: 'diff',
        element: <TwoColumnTool><TextDiff /></TwoColumnTool>,
      },
      {
        path: 'hash',
        element: <SingleColumnTool><HashGenerator /></SingleColumnTool>,
      },
      {
        path: 'uuid',
        element: <SingleColumnTool><UUIDGenerator /></SingleColumnTool>,
      },
      {
        path: 'timestamp',
        element: <TwoColumnTool><TimestampConverter /></TwoColumnTool>,
      },
      {
        path: 'api-tester',
        element: <SingleColumnTool><APITester /></SingleColumnTool>,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

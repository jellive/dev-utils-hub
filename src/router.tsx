import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ToolGrid />,
      },
      {
        path: 'json',
        element: <JsonFormatter />,
      },
      {
        path: 'jwt',
        element: <JwtDecoder />,
      },
      {
        path: 'base64',
        element: <Base64Converter />,
      },
      {
        path: 'url',
        element: <URLConverter />,
      },
      {
        path: 'regex',
        element: <RegexTester />,
      },
      {
        path: 'diff',
        element: <TextDiff />,
      },
      {
        path: 'hash',
        element: <HashGenerator />,
      },
      {
        path: 'uuid',
        element: <UUIDGenerator />,
      },
      {
        path: 'timestamp',
        element: <TimestampConverter />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

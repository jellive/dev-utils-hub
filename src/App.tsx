import { lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstallPWAButton } from './components/InstallPWAButton';
import { useAppStore } from './stores/useAppStore';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';

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

function App() {
  const { activeTool } = useAppStore();
  usePerformanceMonitor(`Tab switch to ${activeTool}`);

  const renderTool = () => {
    switch (activeTool) {
      case 'json':
        return <JsonFormatter />;
      case 'jwt':
        return <JwtDecoder />;
      case 'base64':
        return <Base64Converter />;
      case 'url':
        return <URLConverter />;
      case 'regex':
        return <RegexTester />;
      case 'diff':
        return <TextDiff />;
      case 'hash':
        return <HashGenerator />;
      default: {
        // Exhaustive check - should never reach here
        const _exhaustiveCheck: never = activeTool;
        return _exhaustiveCheck;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <TabNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Loading tool...</p>
                </div>
              </div>
            }
          >
            {renderTool()}
          </Suspense>
        </div>
      </main>
      <OfflineIndicator />
      <InstallPWAButton />
    </div>
  );
}

export default App;

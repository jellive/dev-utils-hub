import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { OfflineIndicator } from './OfflineIndicator';
import { InstallPWAButton } from './InstallPWAButton';
import { SentryRouteTracker } from './SentryRouteTracker';
import { ErrorTrigger } from './ErrorTrigger';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useTranslation } from 'react-i18next';
import { useShortcutFeedback } from './ShortcutFeedback';
import { HistorySidebar } from './history/HistorySidebar';

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { showFeedback, FeedbackComponent } = useShortcutFeedback();
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  usePerformanceMonitor(`Page: ${location.pathname}`);

  // Extract tool name from pathname
  const getToolName = (): string => {
    const path = location.pathname.slice(1); // Remove leading '/'
    return path || 'home';
  };

  // Register keyboard shortcut handlers
  useEffect(() => {
    // Only register shortcuts in Electron environment
    if (!window.api?.shortcuts) return;

    const unsubscribeSwitchTool = window.api.shortcuts.onSwitchTool((route: string) => {
      navigate(route);

      // Show feedback for tool switching
      const toolNames = [
        'Home',
        'JSON Formatter',
        'JWT Decoder',
        'Base64 Converter',
        'URL Converter',
        'Regex Tester',
        'Text Diff',
        'Hash Generator',
        'UUID Generator'
      ];

      const toolIndex = [
        '/',
        '/json',
        '/jwt',
        '/base64',
        '/url',
        '/regex',
        '/diff',
        '/hash',
        '/uuid'
      ].indexOf(route);

      if (toolIndex !== -1) {
        const isMac = navigator.platform.toLowerCase().includes('mac');
        const modifier = isMac ? '⌘' : 'Ctrl';
        showFeedback(`${modifier}${toolIndex + 1}`, toolNames[toolIndex]);
      }
    });

    return () => {
      unsubscribeSwitchTool();
    };
  }, [navigate, showFeedback]);

  const handleBackToGrid = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <SentryRouteTracker />
      <Header />
      <main className="container mx-auto px-4 py-8">
        {isHomePage ? (
          <Outlet />
        ) : (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={handleBackToGrid}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.backToTools')}
            </Button>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <Outlet />
            </div>
          </div>
        )}
      </main>
      <OfflineIndicator />
      <InstallPWAButton />
      <ErrorTrigger />
      <Toaster />
      {FeedbackComponent}
      <HistorySidebar
        tool={getToolName()}
        isOpen={isHistorySidebarOpen}
        onOpenChange={setIsHistorySidebarOpen}
      />
    </div>
  );
}

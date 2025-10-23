import { Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { OfflineIndicator } from './OfflineIndicator';
import { InstallPWAButton } from './InstallPWAButton';
import { ToolLoadingSkeleton } from './ToolLoadingSkeleton';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useTranslation } from 'react-i18next';

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  usePerformanceMonitor(`Page: ${location.pathname}`);

  const handleBackToGrid = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {isHomePage ? (
          <Suspense fallback={<ToolLoadingSkeleton />}>
            <Outlet />
          </Suspense>
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
              <Suspense fallback={<ToolLoadingSkeleton />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        )}
      </main>
      <OfflineIndicator />
      <InstallPWAButton />
      <Toaster />
    </div>
  );
}

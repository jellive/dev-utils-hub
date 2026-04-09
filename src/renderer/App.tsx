import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorTrigger } from './components/ErrorTrigger';
import { AboutDialog } from './components/dialogs/AboutDialog';
import { api } from '@/renderer/lib/tauri-api';
import './i18n/config';

function App() {
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    // Navigation event handlers
    const cleanupNavigateToTool = api.navigation.onNavigateToTool((path: string) => {
      router.navigate(path);
    });

    const cleanupNavigateTo = api.navigation.onNavigateTo((path: string) => {
      router.navigate(path);
    });

    // Cleanup all listeners on unmount
    return () => {
      cleanupNavigateToTool();
      cleanupNavigateTo();
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ErrorTrigger />}
      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
    </>
  );
}

export default App;

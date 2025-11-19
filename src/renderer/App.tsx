import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorTrigger } from './components/ErrorTrigger';
import { AboutDialog } from './components/dialogs/AboutDialog';
import './i18n/config';

function App() {
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    // Use the new preload API for IPC event handling
    if (!window.api?.navigation) return;

    // Navigation event handlers
    const cleanupNavigateToTool = window.api.navigation.onNavigateToTool((path: string) => {
      router.navigate(path);
    });

    const cleanupNavigateTo = window.api.navigation.onNavigateTo((path: string) => {
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

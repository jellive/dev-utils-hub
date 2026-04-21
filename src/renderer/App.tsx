import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorTrigger } from './components/ErrorTrigger';
import { api } from '@/renderer/lib/tauri-api';
import './i18n/config';

function App() {
  useEffect(() => {
    const cleanupNavigateToTool = api.navigation.onNavigateToTool((path: string) => {
      router.navigate(path);
    });

    const cleanupNavigateTo = api.navigation.onNavigateTo((path: string) => {
      router.navigate(path);
    });

    return () => {
      cleanupNavigateToTool();
      cleanupNavigateTo();
    };
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ErrorTrigger />}
    </>
  );
}

export default App;

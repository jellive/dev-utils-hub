import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorTrigger } from './components/ErrorTrigger';
import './i18n/config';

function App() {
  useEffect(() => {
    // Listen for navigation events from tray menu
    const handleNavigateToTool = (_event: any, path: string) => {
      router.navigate(path);
    };

    // @ts-ignore - Electron IPC renderer
    const { ipcRenderer } = window.require?.('electron') || {};

    if (ipcRenderer) {
      ipcRenderer.on('navigate-to-tool', handleNavigateToTool);

      return () => {
        ipcRenderer.removeListener('navigate-to-tool', handleNavigateToTool);
      };
    }
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ErrorTrigger />}
    </>
  );
}

export default App;

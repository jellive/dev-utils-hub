import { RouterProvider } from 'react-router-dom';
import { router } from './renderer/router';
import { ErrorTrigger } from './components/ErrorTrigger';
import './i18n/config';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ErrorTrigger />}
    </>
  );
}

export default App;

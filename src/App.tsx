import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './i18n/config';

function App() {
  return <RouterProvider router={router} />;
}

export default App;

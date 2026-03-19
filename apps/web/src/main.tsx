import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../../src/App.tsx';
import { AppProvider } from '../../../src/context/AppProvider.tsx';
import '../../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import TelehealthContainer from '@/containers/TelehealthContainer';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <TelehealthContainer />
  </StrictMode>
);

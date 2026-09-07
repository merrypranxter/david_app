import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DavidUXOverlay } from './components/DavidUXOverlay';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DavidUXOverlay />
  </StrictMode>,
);

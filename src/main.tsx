import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DavidUXOverlay } from './components/DavidUXOverlay';
import { ActionFeedback } from './components/ActionFeedback';
import './index.css';
import './david-shell-overrides.css';
import './david-mobile.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <DavidUXOverlay />
    <ActionFeedback />
  </StrictMode>,
);

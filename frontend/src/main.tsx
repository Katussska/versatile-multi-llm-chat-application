import { StrictMode } from 'react';

import '@/i18n.ts';

import App from './App.tsx';
import './index.css';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

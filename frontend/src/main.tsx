import { StrictMode } from 'react';

import '@/i18n.ts';
import { QueryClientProvider } from '@tanstack/react-query';

import App from './App.tsx';
import './index.css';
import { queryClient } from './lib/queryClient';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

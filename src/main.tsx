import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

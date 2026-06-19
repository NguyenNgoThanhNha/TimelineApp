import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './auth/AuthContext';
import { AnimatedBackground } from './components/AnimatedBackground';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AnimatedBackground />
      <AuthProvider>
        <App />
      </AuthProvider>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  </React.StrictMode>,
);

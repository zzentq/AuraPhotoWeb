import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { initTelegramWebApp } from './api/telegram';
import { setAuthFailedHandler } from './api/client';
import { useAuthStore } from './store/authStore';

// Глобальные стили (порядок имеет значение)
import './styles/global.css';
import './components/Icons.css';
import './components/AuthedImage.css';
import './components/ImageModal.css';

// Инициализация Telegram WebApp (no-op вне Telegram)
initTelegramWebApp();

// При финальном 401 (refresh не помог) — сбрасываем и идём на splash.
setAuthFailedHandler(() => {
  useAuthStore.getState().setUnauthenticated();
  window.location.href = '/';
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

import axios from 'axios';
import { tokenStorage } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Колбэк для принудительного выхода (устанавливается из authStore)
let onAuthFailed = null;
export function setAuthFailedHandler(fn) {
  onAuthFailed = fn;
}

// --- Request interceptor: добавляем Authorization ---
api.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// --- Response interceptor: на 401 один раз пробуем refresh ---
let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error('No refresh token');

  // Используем голый axios — без интерцепторов, чтобы избежать рекурсии
  const { data } = await axios.post(
    `${BASE_URL}/api/v1/auth/refresh`,
    { refresh_token: refresh },
    { headers: { 'Content-Type': 'application/json' } },
  );
  tokenStorage.setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Не трогаем запросы без конфига и сами refresh-запросы
    if (!original || status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Не пытаемся рефрешить /auth/* запросы — они сами управляют авторизацией
    if (original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      // Если несколько запросов одновременно получили 401 — рефрешим один раз
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (refreshError) {
      tokenStorage.clear();
      if (onAuthFailed) onAuthFailed();
      return Promise.reject(refreshError);
    }
  },
);

import { create } from 'zustand';
import { tokenStorage } from '../api/tokenStorage';

/**
 * Глобальный store авторизации.
 *
 * Состояния:
 * - status: 'idle' | 'authenticating' | 'authenticated' | 'error' | 'unauthenticated'
 * - user: объект пользователя с /users/me или null
 * - error: текст ошибки авторизации
 */
export const useAuthStore = create((set, get) => ({
  status: 'idle',
  user: null,
  error: null,

  setAuthenticating: () => set({ status: 'authenticating', error: null }),

  setAuthenticated: (user) => set({ status: 'authenticated', user, error: null }),

  setError: (message) => set({ status: 'error', error: message }),

  setUnauthenticated: () => set({ status: 'unauthenticated', user: null }),

  updateUser: (patch) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : state.user,
    })),

  /** Оптимистичное обновление баланса токенов (±n) */
  adjustTokens: (delta) =>
    set((state) => {
      if (!state.user) return state;
      const next = Math.max(0, (state.user.tokens ?? 0) + delta);
      return { user: { ...state.user, tokens: next } };
    }),

  logoutLocal: () => {
    tokenStorage.clear();
    set({ status: 'unauthenticated', user: null, error: null });
  },
}));

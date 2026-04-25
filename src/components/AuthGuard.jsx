import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Пускает дальше, только если пользователь авторизован.
 * Иначе редирект на splash, где сработает логика авто-логина.
 */
export function AuthGuard({ children }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'authenticated' && user) {
    return children;
  }
  return <Navigate to="/" replace />;
}

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authTelegram, authTelegramTest } from '../api/auth';
import { getMe } from '../api/users';
import { tokenStorage } from '../api/tokenStorage';
import {
  getInitData,
  getStartParam,
  isInsideTelegram,
  parseReferrerId,
} from '../api/telegram';
import { useAuthStore } from '../store/authStore';
import { StarIcon } from '../components/Icons';
import './SplashPage.css';

const DEV_AUTO_LOGIN =
  String(import.meta.env.VITE_DEV_AUTO_LOGIN || 'false') === 'true';
const DEV_USER_ID = Number(import.meta.env.VITE_DEV_USER_ID || 1);

/**
 * Sequence:
 *   1. Есть валидный access → /users/me → редирект на /profile.
 *   2. Внутри Telegram → /auth/telegram (initData).
 *   3. Вне Telegram + DEV_AUTO_LOGIN=true → /auth/telegram/test.
 *   4. Иначе — кнопка "Открыть в Telegram".
 *
 * Дефолтная страница после авторизации — /profile.
 */
export default function SplashPage() {
  const navigate = useNavigate();
  const setAuthenticating = useAuthStore((s) => s.setAuthenticating);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setError = useAuthStore((s) => s.setError);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);

  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    bootstrap();

    async function bootstrap() {
      setAuthenticating();

      // 1. Есть сохранённые токены?
      if (tokenStorage.getAccess()) {
        try {
          const me = await getMe();
          setAuthenticated(me);
          navigate('/profile', { replace: true });
          return;
        } catch {
          tokenStorage.clear();
        }
      }

      // 2. Telegram Mini App
      if (isInsideTelegram()) {
        try {
          const initData = getInitData();
          const referrerId = parseReferrerId(getStartParam());
          const auth = await authTelegram(initData, referrerId);
          tokenStorage.setTokens(auth.access_token, auth.refresh_token);
          const me = await getMe();
          setAuthenticated(me);
          navigate('/profile', { replace: true });
          return;
        } catch (err) {
          setError(err?.response?.data?.detail || 'Ошибка авторизации Telegram');
          return;
        }
      }

      // 3. Dev-режим вне Telegram
      if (DEV_AUTO_LOGIN) {
        try {
          const auth = await authTelegramTest(DEV_USER_ID);
          tokenStorage.setTokens(auth.access_token, auth.refresh_token);
          const me = await getMe();
          setAuthenticated(me);
          navigate('/profile', { replace: true });
          return;
        } catch (err) {
          setError(
            err?.response?.data?.detail ||
              'Dev-авторизация недоступна. Проверьте, что бекенд запущен в DEBUG-режиме.',
          );
          return;
        }
      }

      // 4. Вне Telegram, без dev-логина
      setUnauthenticated();
    }
  }, [navigate, setAuthenticating, setAuthenticated, setError, setUnauthenticated]);

  const showError = status === 'error';
  const showOpenInTelegram = status === 'unauthenticated';

  return (
    <div className="splash">
      <div className="splash__logo">
        <StarIcon size={56} />
      </div>

      {showError && (
        <div className="splash__message splash__message--error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      )}

      {showOpenInTelegram && (
        <div className="splash__message">
          <p>Откройте приложение через Telegram-бота</p>
          <a
            className="btn btn--primary"
            href={`https://t.me/${import.meta.env.VITE_BOT_USERNAME || 'aura_photo_bot'}`}
            target="_blank"
            rel="noreferrer"
          >
            Перейти в Telegram
          </a>
        </div>
      )}
    </div>
  );
}

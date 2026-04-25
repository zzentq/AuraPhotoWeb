/**
 * Безопасная обёртка над window.Telegram.WebApp.
 *
 * Особенности:
 *  - В Telegram Webview env(safe-area-inset-*) возвращает 0 (известный баг iOS),
 *    поэтому читаем инсеты из WebApp.safeAreaInset / contentSafeAreaInset
 *    и пробрасываем их в CSS как --tg-safe-top / --tg-safe-bottom / ... .
 *  - Подписываемся на safeAreaChanged и contentSafeAreaChanged — значения
 *    меняются, например, при входе в fullscreen или повороте устройства.
 *  - Пытаемся включить fullscreen через requestFullscreen (v8+), молча падаем
 *    на старых клиентах.
 */

function getWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function isInsideTelegram() {
  const wa = getWebApp();
  return Boolean(wa && typeof wa.initData === 'string' && wa.initData.length > 0);
}

/**
 * Читает system + content safe area insets и записывает их в CSS-переменные.
 * Если Telegram SDK не даёт значения (старая версия) — оставляем 0,
 * но CSS всё равно подстрахован через env(safe-area-inset-*) в fallback.
 */
function applySafeAreaInsets() {
  const wa = getWebApp();
  if (!wa) return;

  // safeAreaInset — системные (notch, home indicator)
  // contentSafeAreaInset — от UI Telegram (header при fullscreen, и т.п.)
  const sys = wa.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
  const content = wa.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };

  // Итоговый отступ = максимум из двух (не складываем, чтобы не было двойного отступа)
  const top = Math.max(sys.top || 0, content.top || 0);
  const bottom = Math.max(sys.bottom || 0, content.bottom || 0);
  const left = Math.max(sys.left || 0, content.left || 0);
  const right = Math.max(sys.right || 0, content.right || 0);

  const root = document.documentElement;
  root.style.setProperty('--tg-safe-top', `${top}px`);
  root.style.setProperty('--tg-safe-bottom', `${bottom}px`);
  root.style.setProperty('--tg-safe-left', `${left}px`);
  root.style.setProperty('--tg-safe-right', `${right}px`);
}

export function initTelegramWebApp() {
  const wa = getWebApp();
  if (!wa) return;

  try {
    wa.ready();
    wa.expand();

    // Пробуем включить fullscreen на новых клиентах (SDK v8+).
    // Метод есть не везде — проверяем наличие перед вызовом.
    if (typeof wa.requestFullscreen === 'function') {
      try {
        wa.requestFullscreen();
      } catch {
        /* старые клиенты или уже fullscreen */
      }
    }

    // Отключаем вертикальные свайпы, которые могут закрыть миниапп
    // при скролле (полезно для форм с textarea).
    if (typeof wa.disableVerticalSwipes === 'function') {
      try {
        wa.disableVerticalSwipes();
      } catch {
        /* noop */
      }
    }

    // Запрашиваем значения safe area (в старых клиентах это no-op).
    if (typeof wa.requestSafeArea === 'function') {
      try { wa.requestSafeArea(); } catch { /* noop */ }
    }
    if (typeof wa.requestContentSafeArea === 'function') {
      try { wa.requestContentSafeArea(); } catch { /* noop */ }
    }

    // Начальное применение
    applySafeAreaInsets();

    // Обновление при изменениях
    if (typeof wa.onEvent === 'function') {
      wa.onEvent('safeAreaChanged', applySafeAreaInsets);
      wa.onEvent('contentSafeAreaChanged', applySafeAreaInsets);
      wa.onEvent('viewportChanged', applySafeAreaInsets);
      wa.onEvent('fullscreenChanged', applySafeAreaInsets);
    }

    // Подкрашиваем шапку под дизайн
    if (typeof wa.setHeaderColor === 'function') {
      try { wa.setHeaderColor('#130a03'); } catch { /* noop */ }
    }
    if (typeof wa.setBackgroundColor === 'function') {
      try { wa.setBackgroundColor('#130a03'); } catch { /* noop */ }
    }
  } catch {
    /* на совсем старых версиях что-то может отсутствовать */
  }
}

export function getInitData() {
  return getWebApp()?.initData ?? '';
}

export function getStartParam() {
  return getWebApp()?.initDataUnsafe?.start_param ?? null;
}

export function parseReferrerId(startParam) {
  if (!startParam || typeof startParam !== 'string') return null;
  if (!startParam.startsWith('ref_')) return null;
  const num = Number(startParam.slice(4));
  return Number.isFinite(num) ? num : null;
}

export function hapticImpact(style = 'light') {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred?.(style);
  } catch {
    /* noop */
  }
}

export function hapticNotify(type = 'success') {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred?.(type);
  } catch {
    /* noop */
  }
}

export function openTelegramLink(url) {
  const wa = getWebApp();
  if (wa && typeof wa.openTelegramLink === 'function') {
    wa.openTelegramLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

import { useEffect, useState } from 'react';

/**
 * Возвращает true, только если `condition` остаётся true дольше, чем `delay` мс.
 * Если condition становится false до истечения delay — таймер сбрасывается
 * и хук остаётся в false.
 *
 * Используется, чтобы не показывать "Загружаем…" для коротких запросов:
 * глаз раздражает мелькание индикатора, если данные пришли за 200мс.
 */
export function useDelayedFlag(condition, delay = 1500) {
  const [flag, setFlag] = useState(false);

  useEffect(() => {
    if (!condition) {
      setFlag(false);
      return undefined;
    }
    const t = setTimeout(() => setFlag(true), delay);
    return () => clearTimeout(t);
  }, [condition, delay]);

  return flag;
}

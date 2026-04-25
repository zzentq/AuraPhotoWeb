import { useQuery } from '@tanstack/react-query';
import { getGeneration } from '../api/generations';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 3 * 60 * 1000; // 3 минуты

/**
 * Поллит статус одной генерации по id до получения терминального статуса.
 *
 * Если за POLL_TIMEOUT_MS не получили done/failed — поллинг останавливается,
 * чтобы не долбить сервер бесконечно (воркер мог упасть).
 */
export function useGenerationPolling(id) {
  const startedAt = useQueryKeyTimestamp(id);

  return useQuery({
    queryKey: ['generation', id],
    queryFn: () => getGeneration(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'done' || status === 'failed') return false;
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) return false;
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
  });
}

/** Фиксируем момент начала поллинга, чтобы считать таймаут. */
function useQueryKeyTimestamp(id) {
  // Глобальный Map id -> timestamp. В рамках одной сессии этого достаточно.
  if (!useQueryKeyTimestamp._map) useQueryKeyTimestamp._map = new Map();
  const map = useQueryKeyTimestamp._map;
  if (id && !map.has(id)) map.set(id, Date.now());
  return map.get(id) ?? Date.now();
}

import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { getGeneration, fetchImageBlob } from '../api/generations';
import { TokenBadge } from '../components/TokenBadge';
import { AuthedImage } from '../components/AuthedImage';
import {
  RefreshIcon,
  DownloadIcon,
  GeneratedImageEmoji,
} from '../components/Icons';
import { useAuthStore } from '../store/authStore';
import { hapticNotify } from '../api/telegram';
import './ProgressPage.css';

const POLL_INTERVAL = 2500;
const POLL_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * Экран процесса генерации и результата.
 * URL: /generate/progress?ids=42,43,44 — поллит каждый id до done/failed.
 */
export default function ProgressPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const adjustTokens = useAuthStore((s) => s.adjustTokens);
  const queryClient = useQueryClient();

  const ids = useMemo(() => {
    const raw = params.get('ids') || '';
    return raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }, [params]);

  useEffect(() => {
    if (!ids.length) navigate('/generate', { replace: true });
  }, [ids, navigate]);

  // Поллим все id параллельно
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['generation', id],
      queryFn: () => getGeneration(id),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === 'done' || status === 'failed') return false;
        const firstFetch = query.state.dataUpdatedAt || Date.now();
        if (Date.now() - firstFetch > POLL_TIMEOUT_MS) return false;
        return POLL_INTERVAL;
      },
      refetchIntervalInBackground: false,
    })),
  });

  const generations = queries.map((q) => q.data).filter(Boolean);
  const allTerminal =
    generations.length === ids.length &&
    generations.every((g) => g.status === 'done' || g.status === 'failed');
  const anyFailed = generations.some((g) => g?.status === 'failed');

  // Возврат токенов за failed-генерации (один раз на id)
  useEffect(() => {
    const failed = generations.filter((g) => g.status === 'failed');
    if (!failed.length) return;

    const refundedKey = '__refunded_ids__';
    if (!window[refundedKey]) window[refundedKey] = new Set();
    const refunded = window[refundedKey];

    let toRefund = 0;
    for (const g of failed) {
      if (!refunded.has(g.id)) {
        refunded.add(g.id);
        toRefund += g.tokens_spent || 0;
      }
    }
    if (toRefund > 0) {
      adjustTokens(toRefund);
      hapticNotify('error');
    }
  }, [generations, adjustTokens]);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['generation'] });
    navigate('/generate');
  };

  const handleDownload = async (gen) => {
    try {
      const blob = await fetchImageBlob(gen.image_key);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = (gen.mime_type || 'image/png').split('/')[1] || 'png';
      a.download = `auraphoto-${gen.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  // --- Состояние "ещё генерируется" ---
  if (!allTerminal) {
    return (
      <div className="page progress-page">
        <TokenBadge tokens={user?.tokens} />
        <div className="centered-state">
          <div className="progress-page__spinner" aria-hidden="true">
            <GeneratedImageEmoji size={140} />
          </div>
          <div className="centered-state__title">Генерирую изображение…</div>
          {generations.length > 1 && (
            <div className="progress-page__counter">
              Готово {generations.filter((g) => g.status === 'done').length} из{' '}
              {ids.length}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Все упали ---
  const allFailed = generations.every((g) => g.status === 'failed');
  if (allFailed) {
    return (
      <div className="page progress-page">
        <TokenBadge tokens={user?.tokens} />
        <div className="centered-state">
          <div className="progress-page__error-icon">⚠️</div>
          <div className="centered-state__title">Не удалось сгенерировать</div>
          <p className="progress-page__error-text">
            {generations[0]?.error || 'Попробуйте изменить промпт'}
          </p>
          <p className="progress-page__refund-note">Токены возвращены на баланс</p>
          <button className="btn btn--primary" onClick={handleRetry}>
            <RefreshIcon size={18} /> Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // --- Успех ---
  const successful = generations.filter((g) => g.status === 'done');
  const firstPrompt = successful[0]?.prompt || '';

  return (
    <div className="page progress-page">
      <TokenBadge tokens={user?.tokens} />

      <div className="progress-page__results">
        {successful.map((gen) => (
          <AuthedImage
            key={gen.id}
            imageKey={gen.image_key}
            alt={gen.prompt}
            className="progress-page__image"
          />
        ))}
      </div>

      {firstPrompt && (
        <div className="progress-page__prompt-block">
          <div className="progress-page__prompt-label">Промпт</div>
          <div className="progress-page__prompt-box">{firstPrompt}</div>
        </div>
      )}

      {anyFailed && (
        <div className="progress-page__partial-warning">
          Часть изображений не удалось сгенерировать. Токены за них возвращены.
        </div>
      )}

      <div className="progress-page__actions">
        <button className="btn btn--primary" onClick={handleRetry}>
          <RefreshIcon size={20} /> Повторить
        </button>
        {successful.length === 1 && (
          <button
            className="btn btn--secondary btn--icon"
            aria-label="Скачать"
            onClick={() => handleDownload(successful[0])}
          >
            <DownloadIcon size={22} />
          </button>
        )}
      </div>

      {successful.length > 1 && (
        <div className="progress-page__downloads">
          {successful.map((gen, i) => (
            <button
              key={gen.id}
              className="btn btn--secondary"
              onClick={() => handleDownload(gen)}
            >
              <DownloadIcon size={18} /> Скачать #{i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

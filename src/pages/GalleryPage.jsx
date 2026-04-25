import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { listGenerations } from '../api/generations';
import { TokenBadge } from '../components/TokenBadge';
import { AuthedImage } from '../components/AuthedImage';
import { GeneratedImageEmoji } from '../components/Icons';
import { useAuthStore } from '../store/authStore';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { ImageModal } from '../components/ImageModal';
import './GalleryPage.css';

const PAGE_SIZE = 20;
const SLOW_LOAD_THRESHOLD_MS = 1500;

/**
 * Галерея.
 *
 * Стратегия отображения:
 *  1. Запрос идёт фоном.
 *  2. Если идёт <1.5с — никаких лоадеров: пустой каркас.
 *  3. Если идёт >1.5с — показываем "Загружаем…" по центру.
 *  4. Когда данные пришли:
 *     - есть картинки → сетка
 *     - пусто → "Здесь будут Ваши изображения" с эмодзи
 */
export default function GalleryPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedGen, setSelectedGen] = useState(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isSuccess,
  } = useInfiniteQuery({
    queryKey: ['generations', 'list'],
    queryFn: ({ pageParam = 0 }) =>
      listGenerations({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < (lastPage.total || 0) ? loaded : undefined;
    },
  });

  // Только успешные генерации
  const items = useMemo(() => {
    const all = data?.pages.flatMap((p) => p.items) ?? [];
    return all.filter((g) => g.status === 'done' && g.image_key);
  }, [data]);

  // "Долгая загрузка" — флаг ставится только если запрос идёт >1.5с
  const showSlowLoad = useDelayedFlag(isLoading, SLOW_LOAD_THRESHOLD_MS);

  // Что рендерить:
  // - данные есть → сетка (даже если фоном идёт refetch)
  // - данных нет, isSuccess=true → "пусто"
  // - данных нет, идёт загрузка >1.5с → лоадер
  // - данных нет, идёт быстрая загрузка → ничего (пустой каркас)
  let body;
  if (items.length > 0) {
    body = (
      <>
        <div className="gallery-grid">
          {items.map((gen) => (
            <button
              key={gen.id}
              type="button"
              className="gallery-card"
              onClick={() => setSelectedGen(gen)}
            >
              <AuthedImage
                imageKey={gen.image_key}
                alt={gen.prompt}
                className="gallery-card__image"
              />
            </button>
          ))}
        </div>

        {hasNextPage && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
          </button>
        )}
      </>
    );
  } else if (isSuccess) {
    body = <EmptyGallery />;
  } else if (showSlowLoad) {
    body = (
      <div className="centered-state">
        <div className="gallery-page__loader">
          <GeneratedImageEmoji size={96} />
        </div>
        <div className="centered-state__title">Загружаем…</div>
      </div>
    );
  } else {
    body = <div className="gallery-page__placeholder" />;
  }

  return (
    <div className="page gallery-page">
      <TokenBadge tokens={user?.tokens} />
      <h1 className="page-title">Галерея</h1>

      {body}

      {selectedGen && (
        <ImageModal generation={selectedGen} onClose={() => setSelectedGen(null)} />
      )}
    </div>
  );
}

function EmptyGallery() {
  return (
    <div className="centered-state">
      <div className="gallery-page__empty-emoji">
        <GeneratedImageEmoji size={140} />
      </div>
      <div className="centered-state__title">Здесь будут Ваши изображения</div>
    </div>
  );
}

import { useAuthedImage } from '../hooks/useAuthedImage';
import { StarIcon } from './Icons';

/**
 * Обёртка над <img> для изображений, требующих Authorization header.
 * Показывает скелетон пока блоб грузится, и текст ошибки при фейле.
 */
export function AuthedImage({ imageKey, alt = '', className, onClick }) {
  const { url, error } = useAuthedImage(imageKey);

  return (
    <div className={className} onClick={onClick}>
      {url && <img src={url} alt={alt} loading="lazy" />}
      {!url && !error && (
        <div className="authed-image__skeleton" aria-hidden="true">
          <StarIcon size={28} />
        </div>
      )}
      {error && (
        <div className="authed-image__error" role="alert">
          Не удалось загрузить
        </div>
      )}
    </div>
  );
}

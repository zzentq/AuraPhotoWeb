import { useEffect, useState } from 'react';
import { fetchImageBlob } from '../api/generations';

/**
 * Загружает изображение по image_key через авторизованный запрос
 * и возвращает objectURL, пригодный для <img src={url} />.
 *
 * Автоматически освобождает URL при размонтировании или смене ключа,
 * чтобы не течь памятью.
 */
export function useAuthedImage(imageKey) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageKey) {
      setUrl(null);
      return undefined;
    }
    let cancelled = false;
    let objectUrl = null;

    setError(null);

    fetchImageBlob(imageKey)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageKey]);

  return { url, error };
}

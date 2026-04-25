import { api } from './client';

export async function createGeneration({ modelSlug, prompt, aspectRatio }) {
  const { data } = await api.post('/generations', {
    model_slug: modelSlug,
    prompt,
    aspect_ratio: aspectRatio,
  });
  return data;
}

export async function getGeneration(id) {
  const { data } = await api.get(`/generations/${id}`);
  return data;
}

export async function listGenerations({ limit = 20, offset = 0 } = {}) {
  const { data } = await api.get('/generations', {
    params: { limit, offset },
  });
  return data;
}

/**
 * Получить байты изображения как Blob.
 * Прямой <img src> не сработает — нужен Authorization header.
 */
export async function fetchImageBlob(imageKey) {
  const { data } = await api.get(`/generations/photos/${imageKey}`, {
    responseType: 'blob',
  });
  return data;
}

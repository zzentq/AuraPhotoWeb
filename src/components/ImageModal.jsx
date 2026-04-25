import { useEffect } from 'react';
import { AuthedImage } from './AuthedImage';
import { DownloadIcon } from './Icons';
import { fetchImageBlob } from '../api/generations';

export function ImageModal({ generation, onClose }) {
  // Esc → закрыть
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Блокируем скролл body, пока модалка открыта
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleDownload = async () => {
    try {
      const blob = await fetchImageBlob(generation.image_key);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = (generation.mime_type || 'image/png').split('/')[1] || 'png';
      a.download = `auraphoto-${generation.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div
      className="image-modal"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="image-modal__content" onClick={(e) => e.stopPropagation()}>
        <AuthedImage
          imageKey={generation.image_key}
          alt={generation.prompt}
          className="image-modal__image"
        />
        {generation.prompt && (
          <div className="image-modal__prompt">{generation.prompt}</div>
        )}
        <div className="image-modal__actions">
          <button className="btn btn--secondary" onClick={onClose}>
            Закрыть
          </button>
          <button className="btn btn--primary" onClick={handleDownload}>
            <DownloadIcon size={20} /> Скачать
          </button>
        </div>
      </div>
    </div>
  );
}

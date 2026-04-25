/**
 * Иконки проекта. Каждая — обёртка над SVG/PNG-ассетом из /src/assets.
 *
 * Стратегия перекраски:
 *  - Иконки, которые должны менять цвет (таб-бар, caret, gallery): рендерим
 *    через CSS mask-image — содержимое svg используется как маска,
 *    а цвет задаётся через background-color: currentColor.
 *  - Иконки с фиксированным цветом (upload, refresh, share, download):
 *    рендерим как <img>, цвет берётся из самой svg.
 *  - PNG-эмодзи (rocket, sparkle, generated_image) — тоже <img>.
 */

import homeSvg from '../assets/icons/home.svg';
import profileSvg from '../assets/icons/profile.svg';
import shopSvg from '../assets/icons/shop.svg';
import starSvg from '../assets/icons/star.svg';
import uploadSvg from '../assets/icons/upload.svg';
import refreshSvg from '../assets/icons/refresh.svg';
import shareSvg from '../assets/icons/share.svg';
import gallerySvg from '../assets/icons/gallery.svg';
import downloadSvg from '../assets/icons/download.svg';
import dropdownArrowSvg from '../assets/icons/dropdown_arrow.svg';

import rocketPng from '../assets/images/emoji_rocket_invated.png';
import sparklePng from '../assets/images/emoji_spakle_haven.png';
import generatedPng from '../assets/images/generated_image.png';

/** Базовая обёртка для иконки через mask-image (перекрашиваемая). */
function MaskIcon({ url, size = 24, className = '', style = {} }) {
  return (
    <span
      aria-hidden="true"
      className={'mask-icon ' + className}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        ...style,
      }}
    />
  );
}

/** Базовая обёртка для "картинки-иконки" (PNG / цветной SVG). */
function ImgIcon({ src, size = 24, alt = '', style = {} }) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
}

// --- Иконки таб-бара (перекрашиваемые) ---

export function HomeIcon({ size = 24, className }) {
  return <MaskIcon url={homeSvg} size={size} className={className} />;
}

export function ShopIcon({ size = 24, className }) {
  return <MaskIcon url={shopSvg} size={size} className={className} />;
}

export function ProfileIcon({ size = 24, className }) {
  return <MaskIcon url={profileSvg} size={size} className={className} />;
}

export function GalleryIcon({ size = 24, className }) {
  return <MaskIcon url={gallerySvg} size={size} className={className} />;
}

/** Звезда-sparkle (используется в круглой кнопке таб-бара и в бейдже). */
export function StarIcon({ size = 18, className }) {
  return <MaskIcon url={starSvg} size={size} className={className} />;
}

export function DropdownCaret({ size = 11, className }) {
  return <MaskIcon url={dropdownArrowSvg} size={size} className={className} />;
}

// --- Иконки с фиксированным цветом ---

export function UploadIcon({ size = 66 }) {
  return <ImgIcon src={uploadSvg} size={size} />;
}

export function RefreshIcon({ size = 20 }) {
  return <ImgIcon src={refreshSvg} size={size} />;
}

export function ShareIcon({ size = 16 }) {
  return <ImgIcon src={shareSvg} size={size} />;
}

export function DownloadIcon({ size = 22 }) {
  return <ImgIcon src={downloadSvg} size={size} />;
}

// --- PNG-эмодзи ---

export function RocketEmoji({ size = 22 }) {
  return <ImgIcon src={rocketPng} size={size} />;
}

export function SparkleEmoji({ size = 20 }) {
  return <ImgIcon src={sparklePng} size={size} />;
}

export function GeneratedImageEmoji({ size = 128 }) {
  return <ImgIcon src={generatedPng} size={size} />;
}

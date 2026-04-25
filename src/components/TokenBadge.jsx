import { StarIcon } from './Icons';

/**
 * Бейдж баланса токенов в шапке приложения.
 * Некликабельный — чисто информационный.
 */
export function TokenBadge({ tokens }) {
  return (
    <div className="token-badge" role="status" aria-label="Баланс токенов">
      <span className="token-badge__icon">
        <StarIcon size={18} />
      </span>
      <span>{tokens ?? '…'}</span>
    </div>
  );
}

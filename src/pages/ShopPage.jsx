import { useAuthStore } from '../store/authStore';
import { TokenBadge } from '../components/TokenBadge';
import { ShopIcon, StarIcon } from '../components/Icons';

/**
 * Магазин токенов. API для покупок пока нет — заглушка.
 */
export default function ShopPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="page">
      <TokenBadge tokens={user?.tokens} />
      <h1 className="page-title">Магазин</h1>

      <div className="centered-state">
        <div style={{ color: 'var(--accent)' }}>
          <ShopIcon size={72} />
        </div>
        <div className="centered-state__title">Скоро откроем</div>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 280,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.5,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          Здесь появится возможность покупать токены. А пока — приглашайте
          друзей в разделе «Профиль» и получайте бонусы
          <span
            style={{
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <StarIcon size={14} />
          </span>
        </p>
      </div>
    </div>
  );
}

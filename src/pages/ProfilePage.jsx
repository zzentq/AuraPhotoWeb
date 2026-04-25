import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../api/users';
import { TokenBadge } from '../components/TokenBadge';
import {
  ShareIcon,
  RocketEmoji,
  SparkleEmoji,
  StarIcon,
} from '../components/Icons';
import { useAuthStore } from '../store/authStore';
import {
  openTelegramLink,
  hapticNotify,
  hapticImpact,
} from '../api/telegram';
import './ProfilePage.css';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'aura_photo_bot';

export default function ProfilePage() {
  const storeUser = useAuthStore((s) => s.user);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const logoutLocal = useAuthStore((s) => s.logoutLocal);
  const queryClient = useQueryClient();

  // Подтягиваем актуальные данные пользователя (баланс, статистика)
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (data) setAuthenticated(data);
  }, [data, setAuthenticated]);

  const user = data || storeUser;
  const stats = user?.referral_stats;

  const [copied, setCopied] = useState(false);

  const referralLink =
    stats?.referral_link ||
    `https://t.me/${BOT_USERNAME}?start=ref_${user?.id ?? ''}`;

  const handleInvite = async () => {
    hapticImpact('medium');
    const text = encodeURIComponent(
      'Присоединяйся к AuraPhoto — генерируй картинки по описанию ✨',
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
      referralLink,
    )}&text=${text}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      openTelegramLink(shareUrl);
    } else {
      try {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        hapticNotify('success');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleLogout = () => {
    queryClient.clear();
    logoutLocal();
    window.location.href = '/';
  };

  const displayName =
    user?.first_name || user?.username || 'USER';

  return (
    <div className="page profile-page">
      <TokenBadge tokens={user?.tokens} />

      <div className="profile-page__avatar">
        <div className="profile-page__avatar-inner">
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
      <h1 className="profile-page__name">{displayName.toUpperCase()}</h1>

      <div className="profile-card">
        <h2 className="profile-card__title">Реферальная программа</h2>

        <ul className="profile-card__stats">
          <li>
            <RocketEmoji size={20} />
            <span>Приглашено:</span>
            <strong>{stats?.referral_count ?? 0}</strong>
          </li>
          <li>
            <SparkleEmoji size={18} />
            <span>Получено:</span>
            <strong>{stats?.total_bonus_tokens ?? 0}</strong>
            <span className="profile-card__stat-mini">
              <StarIcon size={14} />
            </span>
          </li>
        </ul>

        <p className="profile-card__hint">
          Вы получите 3 токена за приглашение
        </p>

        <button className="btn btn--primary btn--block" onClick={handleInvite}>
          <ShareIcon size={16} />
          {copied ? 'Ссылка скопирована' : 'Пригласить'}
        </button>
      </div>

      <button
        type="button"
        className="profile-page__logout"
        onClick={handleLogout}
      >
        Выйти
      </button>
    </div>
  );
}

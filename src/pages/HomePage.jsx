import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { TokenBadge } from '../components/TokenBadge';
import { GeneratedImageEmoji } from '../components/Icons';

/**
 * Главная — пока промо-экран. API не отдаёт контента для главной,
 * поэтому показываем CTA на генерацию.
 */
export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="page">
      <TokenBadge tokens={user?.tokens} />

      <div className="centered-state">
        <GeneratedImageEmoji size={140} />
        <h1 className="page-title">AuraPhoto</h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 15,
            fontWeight: 600,
            maxWidth: 280,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Генерация изображений по описанию. Нажмите «Создать» и опишите, что
          хотите увидеть.
        </p>
        <button
          className="btn btn--primary"
          onClick={() => navigate('/generate')}
        >
          Создать изображение
        </button>
      </div>
    </div>
  );
}

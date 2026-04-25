import { useEffect, useState } from 'react';
import { TabBar } from './TabBar';
import { useBottomActionStore } from '../store/bottomActionStore';
import { StarIcon } from './Icons';
import './BottomBar.css';

const SWAP_DURATION = 220;

/**
 * Зафиксированная снизу панель. Слайдит между TabBar и кнопкой submit
 * со swap-анимацией (opacity + scale).
 *
 * Важно: оба слоя находятся в одном фикс-контейнере, поэтому отступ под них
 * в .app-shell всегда одинаковый — макет не "прыгает".
 */
export function BottomBar() {
  const action = useBottomActionStore();
  const showButton = action.active;

  // Внутреннее состояние "что сейчас рендерим" — обновляется с задержкой,
  // чтобы успела пройти exit-анимация уходящего элемента.
  const [renderButton, setRenderButton] = useState(showButton);
  const [animClass, setAnimClass] = useState('bottom-bar__layer--in');

  useEffect(() => {
    if (showButton === renderButton) return undefined;

    // Запускаем exit-анимацию текущего слоя
    setAnimClass('bottom-bar__layer--out');
    const t = setTimeout(() => {
      setRenderButton(showButton);
      setAnimClass('bottom-bar__layer--in');
    }, SWAP_DURATION);

    return () => clearTimeout(t);
  }, [showButton, renderButton]);

  return (
    <div className="bottom-bar" role="presentation">
      <div className={'bottom-bar__layer ' + animClass}>
        {renderButton ? <SubmitLayer /> : <TabBar />}
      </div>
    </div>
  );
}

function SubmitLayer() {
  const { label, disabled, loading, onPress } = useBottomActionStore();

  return (
    <button
      type="button"
      className="btn btn--primary btn--block bottom-bar__submit"
      disabled={disabled || loading || !onPress}
      onClick={() => onPress?.()}
    >
      {loading ? (
        'Отправляем…'
      ) : (
        <>
          <span>{label}</span>
          <span className="bottom-bar__submit-star">
            <StarIcon size={18} />
          </span>
        </>
      )}
    </button>
  );
}

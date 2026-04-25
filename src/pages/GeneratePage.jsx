import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getModels } from '../api/models';
import { createGeneration } from '../api/generations';
import { useAuthStore } from '../store/authStore';
import { useBottomActionStore } from '../store/bottomActionStore';
import { TokenBadge } from '../components/TokenBadge';
import { UploadIcon, DropdownCaret } from '../components/Icons';
import { hapticImpact, hapticNotify } from '../api/telegram';
import './GeneratePage.css';

const MAX_PROMPT_LENGTH = 2000;
const COUNT_OPTIONS = [1, 2, 3, 4];

export default function GeneratePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const adjustTokens = useAuthStore((s) => s.adjustTokens);

  const setSubmitButton = useBottomActionStore((s) => s.setSubmitButton);
  const clearBottomAction = useBottomActionStore((s) => s.clear);

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
    staleTime: 60 * 60 * 1000,
  });

  const activeModel = models[0]; // На MVP — первая модель (Gemini)

  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState(null);
  const [count, setCount] = useState(1);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Дефолтное соотношение, как только подгрузились модели
  useEffect(() => {
    if (!ratio && activeModel?.supported_ratios?.length) {
      setRatio(activeModel.supported_ratios[0]);
    }
  }, [activeModel, ratio]);

  const unitCost = activeModel?.token_cost ?? 0;
  const totalCost = unitCost * count;
  const hasEnoughTokens = (user?.tokens ?? 0) >= totalCost;
  const canSubmit = Boolean(
    activeModel &&
      prompt.trim().length >= 1 &&
      prompt.length <= MAX_PROMPT_LENGTH &&
      ratio &&
      hasEnoughTokens,
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      // API принимает по одной генерации за раз. Если просим 2+ — параллелим.
      const jobs = Array.from({ length: count }).map(() =>
        createGeneration({
          modelSlug: activeModel.slug,
          prompt: prompt.trim(),
          aspectRatio: ratio,
        }),
      );
      return Promise.all(jobs);
    },
    onSuccess: (results) => {
      hapticNotify('success');
      adjustTokens(-totalCost);
      const ids = results.map((r) => r.id);
      navigate(`/generate/progress?ids=${ids.join(',')}`);
    },
    onError: (err) => {
      hapticNotify('error');
      const detail = err?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Не удалось создать генерацию');
    },
  });

  const handleSubmit = () => {
    if (!canSubmit || createMutation.isPending) return;
    setErrorText('');
    hapticImpact('medium');
    createMutation.mutate();
  };

  // Пробрасываем кнопку в BottomBar и очищаем при размонтировании.
  useEffect(() => {
    setSubmitButton({
      label: `Сгенерировать за ${totalCost}`,
      disabled: !canSubmit,
      loading: createMutation.isPending,
      onPress: handleSubmit,
    });
    return () => {
      clearBottomAction();
    };
    // handleSubmit пересоздаётся каждый рендер — ок, мы всегда хотим свежую ссылку.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCost, canSubmit, createMutation.isPending, prompt, count, ratio, activeModel?.slug]);

  return (
    <div className="page generate-page">
      <TokenBadge tokens={user?.tokens} />

      <h1 className="page-title">{activeModel?.name || 'Nano Banana'}</h1>

      {/* Зона загрузки изображения — заглушка (API пока не поддерживает) */}
      <UploadZone disabled />

      <div className="generate-page__controls">
        <PillSelect
          label="Соотношение"
          value={ratio}
          options={activeModel?.supported_ratios ?? []}
          open={ratioOpen}
          onOpen={() => {
            setRatioOpen(true);
            setCountOpen(false);
          }}
          onClose={() => setRatioOpen(false)}
          onSelect={(v) => {
            setRatio(v);
            setRatioOpen(false);
          }}
          loading={modelsLoading}
        />
        <PillSelect
          label="Количество"
          value={count}
          options={COUNT_OPTIONS}
          open={countOpen}
          onOpen={() => {
            setCountOpen(true);
            setRatioOpen(false);
          }}
          onClose={() => setCountOpen(false)}
          onSelect={(v) => {
            setCount(v);
            setCountOpen(false);
          }}
        />
      </div>

      <div className="generate-page__prompt">
        <label className="generate-page__prompt-label" htmlFor="prompt">
          Промпт
        </label>
        <textarea
          id="prompt"
          className="textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          placeholder="Опишите, что хотите сгенерировать"
          rows={4}
        />
        {prompt.length > 0 && (
          <div className="generate-page__prompt-counter">
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </div>
        )}
      </div>

      {errorText && <div className="generate-page__error">{errorText}</div>}

      {!hasEnoughTokens && unitCost > 0 && (
        <div className="generate-page__warning">
          Недостаточно токенов. Нужно {totalCost}, у вас {user?.tokens ?? 0}.
        </div>
      )}
    </div>
  );
}

/**
 * Выпадающий список в виде пилюли.
 */
function PillSelect({ label, value, options, open, onOpen, onClose, onSelect, loading }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open, onClose]);

  const displayValue = useMemo(() => {
    if (loading) return '…';
    if (value == null) return '—';
    return String(value);
  }, [value, loading]);

  return (
    <div className="pill-field" ref={ref}>
      <span className="pill-field__label">{label}</span>
      <div className="pill-field__dropdown">
        <button
          type="button"
          className="pill"
          onClick={open ? onClose : onOpen}
          disabled={loading || !options.length}
        >
          <span>{displayValue}</span>
          <span className="pill__caret">
            <DropdownCaret size={11} />
          </span>
        </button>
        {open && (
          <ul className="pill-field__menu" role="listbox">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  className={
                    'pill-field__menu-item' +
                    (opt === value ? ' pill-field__menu-item--active' : '')
                  }
                  onClick={() => onSelect(opt)}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UploadZone({ disabled }) {
  return (
    <div
      className={'upload-zone' + (disabled ? ' upload-zone--disabled' : '')}
      role="button"
      aria-disabled={disabled}
      tabIndex={-1}
    >
      <UploadIcon size={64} />
      <span className="upload-zone__text">
        {disabled ? 'Загрузить изображение' : 'Загрузить изображение'}
      </span>
    </div>
  );
}

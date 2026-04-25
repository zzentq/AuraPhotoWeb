import { create } from 'zustand';

/**
 * Store для управления нижней панелью на странице /generate.
 *
 * Страница /generate монтирует свой обработчик через setSubmitButton({...}),
 * а BottomBar читает его и рендерит кнопку вместо TabBar.
 * При размонтировании страница вызывает clear().
 */
export const useBottomActionStore = create((set) => ({
  /** Если true — вместо TabBar показываем кнопку */
  active: false,
  /** Текст кнопки */
  label: '',
  /** Включена/выключена */
  disabled: false,
  /** Идёт ли запрос (показываем альтернативный текст и блокируем) */
  loading: false,
  /** Обработчик клика */
  onPress: null,

  setSubmitButton: ({ label, disabled, loading, onPress }) =>
    set({ active: true, label, disabled, loading, onPress }),

  clear: () => set({ active: false, label: '', disabled: false, loading: false, onPress: null }),
}));

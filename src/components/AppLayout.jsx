import { Outlet } from 'react-router-dom';
import { BottomBar } from './BottomBar';

/**
 * Layout для авторизованных страниц.
 * Снизу — фикс BottomBar (TabBar или Submit-кнопка, в зависимости от страницы).
 */
export function AppLayout() {
  return (
    <div className="app-shell">
      <Outlet />
      <BottomBar />
    </div>
  );
}

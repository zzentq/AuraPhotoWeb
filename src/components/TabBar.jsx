import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShopIcon,
  GalleryIcon,
  ProfileIcon,
  StarIcon,
} from './Icons';
import { hapticImpact } from '../api/telegram';
import './TabBar.css';

/**
 * Таб-бар из 5 элементов. Третий (центральный) — круглая акцентная кнопка,
 * которая отцентрирована ровно, а её тень падает строго под ней.
 *
 * Важно: ширина всех 5 слотов одинаковая (flex: 1 1 0), поэтому центральный
 * элемент действительно оказывается в центре полоски.
 */
const TABS = [
  { to: '/home',     Icon: HomeIcon,    label: 'Главная' },
  { to: '/shop',     Icon: ShopIcon,    label: 'Магазин' },
  { to: '/generate', Icon: StarIcon,    label: '',         primary: true },
  { to: '/gallery',  Icon: GalleryIcon, label: 'Галерея' },
  { to: '/profile',  Icon: ProfileIcon, label: 'Профиль' },
];

export function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Главное меню">
      <div className="tab-bar__inner">
        {TABS.map(({ to, Icon, label, primary }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => hapticImpact('light')}
            className={({ isActive }) => {
              const c = ['tab-bar__item'];
              if (primary) c.push('tab-bar__item--primary');
              if (isActive) c.push('tab-bar__item--active');
              return c.join(' ');
            }}
          >
            {primary ? (
              <span className="tab-bar__primary-circle">
                <Icon size={22} className="tab-bar__primary-icon" />
              </span>
            ) : (
              <>
                <span className="tab-bar__icon-wrap">
                  <Icon size={22} />
                </span>
                {label && <span className="tab-bar__label">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

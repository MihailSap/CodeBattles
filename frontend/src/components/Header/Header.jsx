import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logoDark from '../../assets/logo-dark.svg';
import logoLight from '../../assets/logo-light.svg';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../store/slices/authSlice';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { useTheme } from '../ThemeProvider';
import BellIcon from '../../assets/bell-icon.svg';
import AvatarIcon from '../../assets/avatar-icon.svg';
import './Header.css';

const NAV_LINKS = [
  { to: ROUTES.home, label: 'Главная' },
  { to: ROUTES.projects, label: 'Проекты' },
  { to: ROUTES.reviews, label: 'Ревью' },
  { to: ROUTES.leaderboard, label: 'Лидерборд' }
];

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAdmin = user?.role === 'ADMIN';
  const hasUnreadNotifications = Boolean(user?.hasUnreadNotifications || user?.unreadNotificationsCount);
  const logoSrc = theme === 'dark' ? logoDark : logoLight;

  const displayLogin = user?.login || 'Пользователь';
  const displayEmail = user?.email || '—';

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="header">
      <div className="header__left">
        <Link className="header__logo-link" to={ROUTES.home} aria-label="На главную">
          <img className="header__logo" src={logoSrc} alt="CodeBattles" />
        </Link>
      </div>

      <nav className="header__center" aria-label="Навигация по сайту">
        {NAV_LINKS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.home}
            className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header__right">
        <button className="header__icon-button" type="button" aria-label="Уведомления">
          <img className="header__icon-image" src={BellIcon} alt="Уведомления" />
          {hasUnreadNotifications && <span className="header__notification-dot" aria-hidden="true" />}
        </button>

        <div className="header__avatar-wrap" ref={menuRef}>
          <button
            className="header__avatar-button"
            type="button"
            aria-label="Меню пользователя"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prevState) => !prevState)}
          >
            <img className="header__avatar-image" src={user?.avatarImage ? user.avatarImage : AvatarIcon} alt={`Аватар ${displayLogin}`} />
          </button>

          <div className={`header__menu ${isMenuOpen ? 'header__menu--open' : ''}`} role="menu" aria-hidden={!isMenuOpen}>
              <div className="header__menu-user">
                <p className="header__menu-login">{displayLogin}</p>
                <p className="header__menu-email">{displayEmail}</p>
              </div>

              <div className="header__menu-theme">
                <ThemeToggle />
              </div>

              {isAdmin && (
                <Link className="header__menu-link" to={ROUTES.admin} onClick={() => setIsMenuOpen(false)}>
                  Админ-панель
                </Link>
              )}

              <Link className="header__menu-link" to={ROUTES.profile} onClick={() => setIsMenuOpen(false)}>
                Личный кабинет
              </Link>

              <button className="header__menu-link" type="button" onClick={handleLogout} disabled={isLoading}>
                Выход
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

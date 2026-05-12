import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logoDark from '../../assets/logo-dark.svg?url';
import logoLight from '../../assets/logo-light.svg?url';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../store/slices/authSlice';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import { useTheme } from '../ThemeProvider';
import { BellIcon, AvatarIcon, AdminIcon, ExitIcon } from '../Icons/Icons';
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

  const displayLogin = user?.login || 'Пользователь';

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
      <div className="header__content">
        <div className="header__left">
          <Link className="header__logo-link" to={ROUTES.home} aria-label="На главную">
            <img className="header__logo" src={theme === 'dark' ? logoDark : logoLight} alt="CodeBattles" />
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
            <BellIcon />
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
              {user?.avatarPath ?
                <img className="header__avatar-image" src={user?.avatarPath} alt={`Аватар ${displayLogin}`} />
                : <AvatarIcon />
              }
            </button>

            <div className={`header__menu ${isMenuOpen ? 'header__menu--open' : ''}`} role="menu" aria-hidden={!isMenuOpen}>
              <div className="header__menu-theme">
                <ThemeToggle />
              </div>
              <Link className="header__menu-link" to={ROUTES.profile} onClick={() => setIsMenuOpen(false)} title='Личный кабинет'>
                <AvatarIcon />
              </Link>

              {isAdmin && (
                <Link className="header__menu-link" to={ROUTES.admin} onClick={() => setIsMenuOpen(false)} title='Админ панель'>
                  <AdminIcon />
                </Link>
              )}

              <button className="header__menu-link header__menu-link--logout" type="button" onClick={handleLogout} disabled={isLoading}>
                <ExitIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

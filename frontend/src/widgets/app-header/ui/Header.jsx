import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import logoDark from '@/shared/assets/logo-dark.svg?url';
import logoLight from '@/shared/assets/logo-light.svg?url';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { logoutUser } from '@/entities/session';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { useTheme } from '@/shared/lib/theme';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import NotificationToast from '@/shared/ui/notification-toast';
import {
  formatNotificationTime,
  getNotificationRoute,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useNotificationRouteCompletion
} from '@/entities/notification';
import { BellIcon, AvatarIcon, AdminIcon, ExitIcon } from '@/shared/ui/icons';
import NotificationsList from './NotificationsList';
import './Header.css';

const NAV_LINKS = [
  { to: ROUTES.dashboard, label: 'Главная' },
  { to: ROUTES.projects, label: 'Проекты' },
  { to: ROUTES.reviews, label: 'Ревью' },
  { to: ROUTES.leaderboard, label: 'Лидерборд' }
];

const toToastNotification = (notification) => ({
  title: notification.title,
  text: notification.text,
  time: formatNotificationTime(notification.createdAt)
});

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationToDeleteId, setNotificationToDeleteId] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const toastTimersRef = useRef([]);
  const knownNotificationsRef = useRef(null);
  const wasNotificationsOpenRef = useRef(false);
  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
    isError: isNotificationsError
  } = useGetNotificationsQuery(undefined, { skip: !user });
  const [markAllNotificationsRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  useNotificationRouteCompletion();

  const isAdmin = user?.role === 'ADMIN';
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );
  const hasUnreadNotifications = unreadNotificationsCount > 0;

  const displayLogin = user?.login || 'Пользователь';
  const notificationToDelete = notifications.find((notification) => notification.id === notificationToDeleteId);

  useBodyScrollLock(isMenuOpen || isNotificationsOpen);

  const clearToastTimers = useCallback(() => {
    toastTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    toastTimersRef.current = [];
  }, []);

  const showNotificationToast = useCallback(
    (notification) => {
      clearToastTimers();
      setToastNotification(notification);
      setIsToastVisible(false);

      const showTimerId = window.setTimeout(() => {
        setIsToastVisible(true);
      }, 20);
      const hideTimerId = window.setTimeout(() => {
        setIsToastVisible(false);
      }, 4800);
      const removeTimerId = window.setTimeout(() => {
        setToastNotification(null);
      }, 5600);

      toastTimersRef.current = [showTimerId, hideTimerId, removeTimerId];
    },
    [clearToastTimers]
  );

  const dismissNotificationToast = useCallback(() => {
    clearToastTimers();
    setIsToastVisible(false);

    const removeTimerId = window.setTimeout(() => {
      setToastNotification(null);
    }, 560);

    toastTimersRef.current = [removeTimerId];
  }, [clearToastTimers]);

  useEffect(() => {
    if (!isMenuOpen && !isNotificationsOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }

      if (notificationToDelete) {
        return;
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);

        if (!notificationToDelete) {
          setIsNotificationsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isNotificationsOpen, notificationToDelete]);

  useEffect(() => {
    if (!user) {
      knownNotificationsRef.current = null;
      return;
    }

    if (isNotificationsLoading) {
      return;
    }

    const nextKnownNotifications = new Map(
      notifications.map((notification) => [notification.id, notification.createdAt])
    );

    if (!knownNotificationsRef.current) {
      knownNotificationsRef.current = nextKnownNotifications;
      return;
    }

    const newNotifications = notifications.filter(
      (notification) =>
        !notification.isRead &&
        knownNotificationsRef.current.get(notification.id) !== notification.createdAt
    );

    knownNotificationsRef.current = nextKnownNotifications;

    if (!isNotificationsOpen && newNotifications.length > 0) {
      showNotificationToast(toToastNotification(newNotifications[0]));
    }
  }, [isNotificationsLoading, isNotificationsOpen, notifications, showNotificationToast, user]);

  useEffect(() => {
    const wasOpen = wasNotificationsOpenRef.current;
    wasNotificationsOpenRef.current = isNotificationsOpen;

    if (!wasOpen || isNotificationsOpen || unreadNotificationsCount === 0) {
      return;
    }

    markAllNotificationsRead();
  }, [isNotificationsOpen, markAllNotificationsRead, unreadNotificationsCount]);

  useEffect(() => {
    return () => {
      clearToastTimers();
    };
  }, [clearToastTimers]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.login, { replace: true });
  };

  const handleToggleNotifications = () => {
    const willOpen = !isNotificationsOpen;

    if (willOpen) {
      dismissNotificationToast();
    }

    setIsNotificationsOpen(willOpen);
    setIsMenuOpen(false);
  };

  const handleToggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
    setIsNotificationsOpen(false);
  };

  const handleNotificationClick = (notification) => {
    const route = getNotificationRoute(notification);

    if (!route) {
      return;
    }

    setIsNotificationsOpen(false);
    navigate(route);
  };

  const handleConfirmDeleteNotification = async () => {
    if (!notificationToDelete) {
      return;
    }

    await deleteNotification(notificationToDelete.id);
    setNotificationToDeleteId(null);
  };

  return (
    <>
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
                end={item.to === ROUTES.dashboard}
                className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsNotificationsOpen(false);
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header__right">
            <div className="header__notifications-wrap" ref={notificationsRef}>
              <button
                className="header__icon-button"
                type="button"
                aria-label="Уведомления"
                aria-expanded={isNotificationsOpen}
                aria-controls="header-notifications"
                onClick={handleToggleNotifications}
              >
                <BellIcon />
                {hasUnreadNotifications && <span className="header__notification-dot" aria-hidden="true" />}
              </button>

              <div
                className={`header__notifications-panel ${isNotificationsOpen ? 'header__notifications-panel--open' : ''}`}
                id="header-notifications"
                role="region"
                aria-label="Список уведомлений"
                aria-hidden={!isNotificationsOpen}
              >
                <div className="header__notifications-head">
                  <div>
                    <h2 className="header__notifications-title">Уведомления</h2>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <span className="header__notifications-count">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>

                <NotificationsList
                  notifications={notifications}
                  isLoading={isNotificationsLoading}
                  isError={isNotificationsError}
                  onNotificationClick={handleNotificationClick}
                  onDeleteNotification={setNotificationToDeleteId}
                />
              </div>
            </div>

            <div className="header__avatar-wrap" ref={menuRef}>
              <button
                className="header__avatar-button"
                type="button"
                aria-label="Меню пользователя"
                aria-expanded={isMenuOpen}
                onClick={handleToggleMenu}
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

      <NotificationToast notification={toastNotification} isVisible={isToastVisible} onClose={dismissNotificationToast} />

      <ConfirmActionModal
        isOpen={Boolean(notificationToDelete)}
        title="Удалить уведомление?"
        description={notificationToDelete ? `Уведомление "${notificationToDelete.title}" будет удалено из списка.` : ''}
        confirmLabel="Удалить"
        onCancel={() => setNotificationToDeleteId(null)}
        onConfirm={handleConfirmDeleteNotification}
        isSubmitting={false}
        isDeleteAction
      />
    </>
  );
};

export default Header;

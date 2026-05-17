import { useCallback, useEffect, useRef, useState } from 'react';
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
import { BellIcon, AvatarIcon, AdminIcon, ExitIcon, CheckIcon, DeleteIcon } from '@/shared/ui/icons';
import './Header.css';

const NAV_LINKS = [
  { to: ROUTES.home, label: 'Главная' },
  { to: ROUTES.projects, label: 'Проекты' },
  { to: ROUTES.reviews, label: 'Ревью' },
  { to: ROUTES.leaderboard, label: 'Лидерборд' }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Новое ревью по задаче',
    text: 'Команда оставила комментарии к решению в проекте Code Arena.',
    time: '5 минут назад',
    isRead: false
  },
  {
    id: 2,
    title: 'Приглашение в проект',
    text: 'Вас пригласили присоединиться к проекту Frontend Sprint.',
    time: 'Сегодня, 12:20',
    isRead: false
  },
  {
    id: 3,
    title: 'Проверка завершена',
    text: 'Автоматические тесты по последней отправке успешно пройдены.',
    time: 'Вчера',
    isRead: true
  }
];

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [notificationToDeleteId, setNotificationToDeleteId] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const toastTimersRef = useRef([]);
  const hasShownInitialToastRef = useRef(false);

  const isAdmin = user?.role === 'ADMIN';
  const unreadNotificationsCount = notifications.filter((notification) => !notification.isRead).length;
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

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isNotificationsOpen]);

  useEffect(() => {
    if (isNotificationsOpen || hasShownInitialToastRef.current) {
      return;
    }

    const initialToastTimerId = window.setTimeout(() => {
      hasShownInitialToastRef.current = true;
      showNotificationToast(INITIAL_NOTIFICATIONS[0]);
    }, 900);

    return () => {
      window.clearTimeout(initialToastTimerId);
    };
  }, [isNotificationsOpen, showNotificationToast]);

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

  const handleMarkNotificationRead = (notificationId) => {
    const currentNotification = notifications.find((notification) => notification.id === notificationId);

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );

    if (currentNotification) {
      showNotificationToast({
        ...currentNotification,
        title: 'Уведомление прочитано',
        text: currentNotification.title,
        time: 'Сейчас',
        isRead: true
      });
    }
  };

  const handleConfirmDeleteNotification = () => {
    if (!notificationToDelete) {
      return;
    }

    setNotifications((currentNotifications) =>
      currentNotifications.filter((notification) => notification.id !== notificationToDelete.id)
    );
    setNotificationToDeleteId(null);
    showNotificationToast({
      title: 'Уведомление удалено',
      text: notificationToDelete.title,
      time: 'Сейчас',
      isRead: true
    });
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
                end={item.to === ROUTES.home}
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
                  <h2 className="header__notifications-title">Уведомления</h2>
                  {unreadNotificationsCount > 0 && (
                    <span className="header__notifications-count">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </div>

                {notifications.length > 0 ? (
                  <div className="header__notifications-list">
                    {notifications.map((notification) => (
                      <article
                        className={`header__notification-card ${notification.isRead ? 'header__notification-card--read' : ''}`}
                        key={notification.id}
                      >
                        <div className="header__notification-content">
                          <div className="header__notification-meta">
                            <h3 className="header__notification-title">{notification.title}</h3>
                            <span className="header__notification-time">{notification.time}</span>
                          </div>
                          <p className="header__notification-text">{notification.text}</p>
                        </div>

                        <div className="header__notification-actions" aria-label={`Действия с уведомлением: ${notification.title}`}>
                          <button
                            className="header__notification-action"
                            type="button"
                            title="Пометить прочитанным"
                            aria-label={`Пометить уведомление "${notification.title}" прочитанным`}
                            onClick={() => handleMarkNotificationRead(notification.id)}
                            disabled={notification.isRead}
                          >
                            <CheckIcon />
                          </button>
                          <button
                            className="header__notification-action header__notification-action--delete"
                            type="button"
                            title="Удалить"
                            aria-label={`Удалить уведомление "${notification.title}"`}
                            onClick={() => setNotificationToDeleteId(notification.id)}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="header__notifications-empty">Новых уведомлений нет</p>
                )}
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

      {toastNotification && (
        <div
          className={`header-toast ${isToastVisible ? 'header-toast--visible' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="header-toast__icon" aria-hidden="true">
            <BellIcon />
          </span>
          <div className="header-toast__content">
            <div className="header-toast__meta">
              <strong className="header-toast__title">{toastNotification.title}</strong>
              <span className="header-toast__time">{toastNotification.time}</span>
            </div>
            <p className="header-toast__text">{toastNotification.text}</p>
          </div>
          <span className="header-toast__progress" aria-hidden="true" />
        </div>
      )}

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

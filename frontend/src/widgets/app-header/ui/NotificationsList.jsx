import { formatNotificationTime, getNotificationRoute } from '@/entities/notification';
import { DeleteIcon } from '@/shared/ui/icons';

const NotificationsList = ({ notifications, isLoading, isError, onNotificationClick, onDeleteNotification }) => {
  if (isLoading) {
    return <p className="header__notifications-empty">Загружаем уведомления...</p>;
  }

  if (isError) {
    return <p className="header__notifications-empty">Не удалось загрузить уведомления</p>;
  }

  if (notifications.length === 0) {
    return <p className="header__notifications-empty">Новых уведомлений нет</p>;
  }

  return (
    <div className="header__notifications-list">
      {notifications.map((notification) => {
        const route = getNotificationRoute(notification);

        return (
          <article
            className={`header__notification-card ${notification.isRead ? 'header__notification-card--read' : ''}`}
            key={notification.id}
          >
            <div className="header__notification-content">
              <span className="header__notification-meta">
                <span className="header__notification-title">{notification.title}</span>
                <span className="header__notification-time">{formatNotificationTime(notification.createdAt)}</span>
              </span>
              <span className="header__notification-text">{notification.text}</span>
            </div>

            {route && (
              <button
                className="header__notification-open"
                type="button"
                aria-label={`Открыть уведомление "${notification.title}"`}
                onClick={() => onNotificationClick(notification)}
              />
            )}

            <button
              className="header__notification-action"
              type="button"
              title="Удалить"
              aria-label={`Удалить уведомление "${notification.title}"`}
              onClick={() => onDeleteNotification(notification.id)}
            >
              <DeleteIcon />
            </button>
          </article>
        );
      })}
    </div>
  );
};

export default NotificationsList;

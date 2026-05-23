import { formatNotificationTime, getNotificationRoute } from '@/entities/notification';
import { DeleteIcon } from '@/shared/ui/icons';
import headerStyles from './Header.module.scss';

const NotificationsList = ({
  notifications,
  isLoading,
  isError,
  onNotificationClick,
  onDeleteNotification,
}: LegacyValue) => {
  if (isLoading) {
    return <p className={headerStyles.notificationsEmpty}>Загружаем уведомления...</p>;
  }

  if (isError) {
    return <p className={headerStyles.notificationsEmpty}>Не удалось загрузить уведомления</p>;
  }

  if (notifications.length === 0) {
    return <p className={headerStyles.notificationsEmpty}>Новых уведомлений нет</p>;
  }

  return (
    <div className={headerStyles.notificationsList}>
      {notifications.map((notification: LegacyValue) => {
        const route = getNotificationRoute(notification);

        return (
          <article
            className={[headerStyles.notificationCard, notification.isRead ? headerStyles.isRead : '']
              .filter(Boolean)
              .join(' ')}
            key={notification.id}
          >
            <div className={headerStyles.notificationContent}>
              <span className={headerStyles.notificationMeta}>
                <span className={headerStyles.notificationTitle}>{notification.title}</span>
                <span className={headerStyles.notificationTime}>{formatNotificationTime(notification.createdAt)}</span>
              </span>
              <span className={headerStyles.notificationText}>{notification.text}</span>
            </div>

            {route && (
              <button
                className={headerStyles.notificationOpen}
                type="button"
                aria-label={`Открыть уведомление "${notification.title}"`}
                onClick={() => onNotificationClick(notification)}
              />
            )}

            <button
              className={headerStyles.notificationAction}
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

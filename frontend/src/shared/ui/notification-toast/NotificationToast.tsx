import { BellIcon, CrossIcon } from '@/shared/ui/icons';
import notificationToastStyles from './NotificationToast.module.scss';

interface NotificationToastData {
  title: string;
  time: string;
  text: string;
}

interface NotificationToastProps {
  notification: NotificationToastData | null;
  isVisible: boolean;
  onClose: () => void;
}

const NotificationToast = ({ notification, isVisible, onClose }: NotificationToastProps) => {
  if (!notification) {
    return null;
  }

  return (
    <div
      className={[notificationToastStyles.root, isVisible ? notificationToastStyles.isVisible : '']
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className={notificationToastStyles.icon} aria-hidden="true">
        <BellIcon />
      </span>
      <div className={notificationToastStyles.content}>
        <div className={notificationToastStyles.meta}>
          <strong className={notificationToastStyles.title}>{notification.title}</strong>
          <span className={notificationToastStyles.time}>{notification.time}</span>
        </div>
        <p className={notificationToastStyles.text}>{notification.text}</p>
      </div>
      <button
        className={notificationToastStyles.close}
        type="button"
        onClick={onClose}
        aria-label="Закрыть уведомление"
      >
        <CrossIcon />
      </button>
      <span className={notificationToastStyles.progress} aria-hidden="true" />
    </div>
  );
};

export default NotificationToast;

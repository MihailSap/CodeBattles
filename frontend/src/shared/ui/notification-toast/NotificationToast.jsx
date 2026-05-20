import { BellIcon, CrossIcon } from '@/shared/ui/icons';
import './NotificationToast.css';

const NotificationToast = ({ notification, isVisible, onClose }) => {
  if (!notification) {
    return null;
  }

  return (
    <div
      className={`notification-toast ${isVisible ? 'notification-toast--visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="notification-toast__icon" aria-hidden="true">
        <BellIcon />
      </span>
      <div className="notification-toast__content">
        <div className="notification-toast__meta">
          <strong className="notification-toast__title">{notification.title}</strong>
          <span className="notification-toast__time">{notification.time}</span>
        </div>
        <p className="notification-toast__text">{notification.text}</p>
      </div>
      <button className="notification-toast__close" type="button" onClick={onClose} aria-label="Закрыть уведомление">
        <CrossIcon />
      </button>
      <span className="notification-toast__progress" aria-hidden="true" />
    </div>
  );
};

export default NotificationToast;

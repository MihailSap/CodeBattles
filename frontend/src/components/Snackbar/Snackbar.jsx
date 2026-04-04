import { useEffect, useState } from 'react';
import './Snackbar.css';

const Snackbar = ({ message, type = 'success', onClose }) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [displayedType, setDisplayedType] = useState('success');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      const frameId = window.requestAnimationFrame(() => {
        setDisplayedMessage(message);
        setDisplayedType(type);
        setIsVisible(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (!displayedMessage) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(false);
    });
    const timeoutId = window.setTimeout(() => {
      setDisplayedMessage('');
    }, 260);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [displayedMessage, message, type]);

  if (!displayedMessage) {
    return null;
  }

  return (
    <div className={`snackbar snackbar--${displayedType} ${isVisible ? 'snackbar--visible' : 'snackbar--hidden'}`} role="status" aria-live="polite">
      <span className="snackbar__message">{displayedMessage}</span>
      <button className="snackbar__close" type="button" onClick={onClose} aria-label="Закрыть уведомление">
        ×
      </button>
    </div>
  );
};

export default Snackbar;

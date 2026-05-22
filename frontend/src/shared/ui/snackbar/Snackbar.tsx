import { useEffect, useState } from 'react';
import { CrossIcon } from '@/shared/ui/icons';
import snackbarStyles from './Snackbar.module.scss';

const TYPE_CLASS = {
  success: snackbarStyles.isSuccess,
  error: snackbarStyles.isError,
};

const normalizeType = (type: LegacyValue) => (String(type).toLowerCase().includes('error') ? 'error' : 'success');

const Snackbar = ({ message, type = 'success', onClose }: LegacyValue) => {
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
    <div
      className={[
        snackbarStyles.root,
        TYPE_CLASS[normalizeType(displayedType)],
        isVisible ? snackbarStyles.isVisible : snackbarStyles.isHidden,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <span className={snackbarStyles.message}>{displayedMessage}</span>
      <button className={snackbarStyles.close} type="button" onClick={onClose} aria-label="Закрыть уведомление">
        <CrossIcon />
      </button>
      <span className={snackbarStyles.progress} aria-hidden="true" />
    </div>
  );
};

export default Snackbar;

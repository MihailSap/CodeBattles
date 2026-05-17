import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_SNACKBAR = { message: '', type: 'success' };
const DEFAULT_DURATION = 3000;

export const useSnackbar = (duration = DEFAULT_DURATION) => {
  const [snackbar, setSnackbar] = useState(DEFAULT_SNACKBAR);
  const timeoutRef = useRef(null);

  const clearAutoClose = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeSnackbar = useCallback(() => {
    clearAutoClose();
    setSnackbar(DEFAULT_SNACKBAR);
  }, [clearAutoClose]);

  const showSnackbar = useCallback(
    (message, type = 'success') => {
      clearAutoClose();
      setSnackbar({ message, type });

      timeoutRef.current = window.setTimeout(() => {
        setSnackbar(DEFAULT_SNACKBAR);
        timeoutRef.current = null;
      }, duration);
    },
    [clearAutoClose, duration]
  );

  useEffect(() => {
    return () => {
      clearAutoClose();
    };
  }, [clearAutoClose]);

  return { snackbar, showSnackbar, closeSnackbar };
};

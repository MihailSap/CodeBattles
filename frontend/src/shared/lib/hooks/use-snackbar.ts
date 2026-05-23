import { useCallback, useEffect, useRef, useState } from 'react';

type SnackbarType = string;

interface SnackbarState {
  message: string;
  type: SnackbarType;
}

const DEFAULT_SNACKBAR: SnackbarState = {
  message: '',
  type: 'success',
};

const DEFAULT_DURATION = 3000;

export const useSnackbar = (duration = DEFAULT_DURATION) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>(DEFAULT_SNACKBAR);
  const timeoutRef = useRef<number | null>(null);

  const clearAutoClose = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const closeSnackbar = useCallback(() => {
    clearAutoClose();
    setSnackbar(DEFAULT_SNACKBAR);
  }, [clearAutoClose]);

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = 'success') => {
      clearAutoClose();

      setSnackbar({
        message,
        type,
      });

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

  return {
    snackbar,
    showSnackbar,
    closeSnackbar,
  };
};

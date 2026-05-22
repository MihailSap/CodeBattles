import { useEffect } from 'react';

export const useBodyScrollLock = (isLocked: LegacyValue) => {
  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLocked]);
};

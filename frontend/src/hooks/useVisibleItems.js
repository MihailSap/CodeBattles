import { useEffect, useMemo, useRef, useState } from 'react';

export const useVisibleItems = (items, chunkSize) => {
  const sentinelRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(chunkSize);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry.isIntersecting) {
          return;
        }

        setVisibleCount((previousState) => {
          if (previousState >= items.length) {
            return previousState;
          }

          return previousState + chunkSize;
        });
      },
      {
        root: null,
        rootMargin: '0px 0px 120px 0px',
        threshold: 0
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [chunkSize, items.length]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  return {
    visibleItems,
    hasMore: visibleCount < items.length,
    sentinelRef
  };
};

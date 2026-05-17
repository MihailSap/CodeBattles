import { useEffect, useMemo, useState } from 'react';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { useDebouncedValue } from '@/shared/lib/hooks';
import Spinner from '@/shared/ui/spinner';
import './JoinSearchModal.css';

const JoinSearchModal = ({
  mode,
  fetchItems,
  onClose,
  onJoin,
  onRequestAccess
}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [items, setItems] = useState([]);
  const [pendingRequestIds, setPendingRequestIds] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useBodyScrollLock(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const result = await fetchItems({ query: debouncedQuery });

        if (!isMounted) {
          return;
        }

        setItems(result.data);
        setPendingRequestIds([]);
      } catch {
        if (!isMounted) {
          return;
        }

        setItems([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, fetchItems]);

  const title = useMemo(() => (mode === 'projects' ? 'Поиск проектов' : 'Поиск организации'), [mode]);

  const loadMore = async () => {
    if (!hasMore) {
      return;
    }

    const result = await fetchItems({ query: debouncedQuery });
    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.hasMore);
  };

  const handleScroll = (event) => {
    const target = event.currentTarget;
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 24;

    if (isBottom) {
      loadMore();
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      overlayClassName="join-search-modal__overlay"
      dialogClassName="join-search-modal"
      ariaLabel={title}
      title={title}
      headerClassName="join-search-modal__head"
      titleClassName="join-search-modal__title"
      closeClassName="join-search-modal__close"
      closeAriaLabel="Закрыть окно"
    >
        <div className="join-search-modal__content">
          <input
            className="join-search-modal__search"
            type="search"
            placeholder="Поиск по названию и описанию"
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 120))}
          />

          <ul className="join-search-modal__list" onScroll={handleScroll}>
            {isLoading ? (
              <li className="join-search-modal__loading">
                <Spinner />
              </li>
            ) : items.length === 0 ? (
              <li className="join-search-modal__empty">Ничего не найдено</li>
            ) : (
              items.map((item, index) => (
                <li key={item.id} className={`join-search-modal__item ${index === items.length - 1 ? 'join-search-modal__item--last' : ''}`}>
                  {mode === 'projects' ? (
                    <div className="join-search-modal__item-row">
                      <div className="join-search-modal__main">
                        <p className="join-search-modal__name">{item.name}</p>
                        <p className="join-search-modal__value">Участников: {item.participantsCount}</p>
                        <p className="join-search-modal__value">Открытых задач: {item.openTasksCount}</p>
                      </div>
                      <button className="join-search-modal__action" type="button" onClick={async () => {
                        await onJoin(item.id);
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                      }}
                      >
                        Вступить
                      </button>
                    </div>
                  ) : (
                    <div className="join-search-modal__item-row">
                      <div className="join-search-modal__organization">
                        <img className="join-search-modal__logo" src={item.logo} alt={`Логотип ${item.name}`} />
                        <div className="join-search-modal__main">
                          <p className="join-search-modal__name">{item.name}</p>
                          <p className="join-search-modal__value">Участников: {item.participantsCount}</p>
                          <p className="join-search-modal__value">Проектов: {item.projectsCount}</p>
                        </div>
                      </div>
                      {item.hasPendingRequest || pendingRequestIds.includes(item.id) ? (
                        <span className="join-search-modal__status">Запрос отправлен</span>
                      ) : (
                        <button
                          className="join-search-modal__action"
                          type="button"
                          onClick={async () => {
                            await onRequestAccess(item.id);
                            setPendingRequestIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
                          }}
                        >
                          Запросить доступ
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
    </ModalShell>
  );
};

export default JoinSearchModal;

import { useEffect, useMemo, useState } from 'react';
import { CrossIcon } from '../Icons/Icons';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import Spinner from '../Spinner/Spinner';
import './JoinSearchModal.css';

const JoinSearchModal = ({
  mode,
  fetchItems,
  onClose,
  onJoin,
  onRequestAccess
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useBodyScrollLock(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const result = await fetchItems({ query: debouncedQuery, page: 1, pageSize: 15 });

        if (!isMounted) {
          return;
        }

        setItems(result.data);
        setPage(1);
        setHasMore(result.hasMore);
      } catch {
        if (!isMounted) {
          return;
        }

        setItems([]);
        setPage(1);
        setHasMore(false);
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

    const nextPage = page + 1;
    const result = await fetchItems({ query: debouncedQuery, page: nextPage, pageSize: 15 });
    setItems((prev) => [...prev, ...result.data]);
    setPage(nextPage);
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
    <div className="join-search-modal__overlay" role="presentation" onClick={onClose}>
      <div className="join-search-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="join-search-modal__head">
          <h2 className="join-search-modal__title">{title}</h2>
          <button className="join-search-modal__close" type="button" onClick={onClose} aria-label="Закрыть окно">
            <CrossIcon />
          </button>
        </div>

        <div className="join-search-modal__content">
          <input
            className="join-search-modal__search"
            type="text"
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
                      <button className="join-search-modal__action" type="button" onClick={() => onJoin(item.id)}>
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
                      {item.hasPendingRequest ? (
                        <span className="join-search-modal__status">Запрос отправлен</span>
                      ) : (
                        <button className="join-search-modal__action" type="button" onClick={() => onRequestAccess(item.id)}>
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
      </div>
    </div>
  );
};

export default JoinSearchModal;

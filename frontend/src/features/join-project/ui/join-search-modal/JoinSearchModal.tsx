import { type ChangeEvent, type UIEvent, useEffect, useMemo, useState } from 'react';
import type { EntityId } from '@/entities/project';
import ModalShell from '@/shared/ui/modal-shell';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { useDebouncedValue } from '@/shared/lib/hooks';
import Spinner from '@/shared/ui/spinner';
import joinSearchModalStyles from './JoinSearchModal.module.scss';

interface JoinSearchItem {
  id: EntityId;
  name: string;
  logo?: string;
  participantsCount?: number;
  openTasksCount?: number;
  projectsCount?: number;
  hasPendingRequest?: boolean;
}

interface JoinSearchResult {
  data: JoinSearchItem[];
  hasMore?: boolean;
}

interface JoinSearchModalProps {
  mode: 'projects' | 'organizations';
  fetchItems: (params: { query: string }) => Promise<JoinSearchResult>;
  onClose: () => void;
  onJoin?: ((id: EntityId) => void | Promise<void>) | undefined;
  onRequestAccess?: ((id: EntityId) => void | Promise<void>) | undefined;
}

const JoinSearchModal = ({ mode, fetchItems, onClose, onJoin, onRequestAccess }: JoinSearchModalProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [items, setItems] = useState<JoinSearchItem[]>([]);
  const [pendingRequestIds, setPendingRequestIds] = useState<EntityId[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useBodyScrollLock(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const result = await fetchItems({
          query: debouncedQuery,
        });

        if (!isMounted) {
          return;
        }

        setItems(result.data);
        setHasMore(result.hasMore ?? false);
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

    const result = await fetchItems({
      query: debouncedQuery,
    });

    setItems((prev) => [...prev, ...result.data]);
    setHasMore(result.hasMore ?? false);
  };

  const handleScroll = (event: UIEvent<HTMLUListElement>) => {
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
      overlayClassName={joinSearchModalStyles.overlay}
      dialogClassName={joinSearchModalStyles.root}
      ariaLabel={title}
      title={title}
      headerClassName={joinSearchModalStyles.head}
      titleClassName={joinSearchModalStyles.title}
      closeClassName={joinSearchModalStyles.close}
      closeAriaLabel="Закрыть окно"
    >
      <div className={joinSearchModalStyles.content}>
        <input
          className={joinSearchModalStyles.search}
          type="search"
          placeholder="Поиск по названию и описанию"
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value.slice(0, 120))}
        />

        <ul className={joinSearchModalStyles.list} onScroll={handleScroll}>
          {isLoading ? (
            <li className={joinSearchModalStyles.isLoading}>
              <Spinner />
            </li>
          ) : items.length === 0 ? (
            <li className={joinSearchModalStyles.isEmpty}>Ничего не найдено</li>
          ) : (
            items.map((item, index) => (
              <li
                key={item.id}
                className={[joinSearchModalStyles.item, index === items.length - 1 ? joinSearchModalStyles.isLast : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {mode === 'projects' ? (
                  <div className={joinSearchModalStyles.itemRow}>
                    <div className={joinSearchModalStyles.main}>
                      <p className={joinSearchModalStyles.name}>{item.name}</p>
                      <p className={joinSearchModalStyles.value}>Участников: {item.participantsCount ?? 0}</p>
                      <p className={joinSearchModalStyles.value}>Открытых задач: {item.openTasksCount ?? 0}</p>
                    </div>
                    <button
                      className={joinSearchModalStyles.action}
                      type="button"
                      onClick={async () => {
                        await onJoin?.(item.id);
                        setItems((prev) => prev.filter((listedItem) => listedItem.id !== item.id));
                      }}
                    >
                      Вступить
                    </button>
                  </div>
                ) : (
                  <div className={joinSearchModalStyles.itemRow}>
                    <div className={joinSearchModalStyles.organization}>
                      {item.logo && (
                        <img className={joinSearchModalStyles.logo} src={item.logo} alt={`Логотип ${item.name}`} />
                      )}
                      <div className={joinSearchModalStyles.main}>
                        <p className={joinSearchModalStyles.name}>{item.name}</p>
                        <p className={joinSearchModalStyles.value}>Участников: {item.participantsCount ?? 0}</p>
                        <p className={joinSearchModalStyles.value}>Проектов: {item.projectsCount ?? 0}</p>
                      </div>
                    </div>
                    {item.hasPendingRequest || pendingRequestIds.includes(item.id) ? (
                      <span className={joinSearchModalStyles.status}>Запрос отправлен</span>
                    ) : (
                      <button
                        className={joinSearchModalStyles.action}
                        type="button"
                        onClick={async () => {
                          await onRequestAccess?.(item.id);

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

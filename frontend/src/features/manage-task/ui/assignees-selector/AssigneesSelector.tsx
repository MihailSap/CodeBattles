import { type ChangeEvent, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EntityId, ProjectParticipant } from '@/entities/project';
import { AvatarIcon } from '@/shared/ui/icons';
import { useVisibleItems } from '@/shared/lib/hooks';
import assigneesSelectorStyles from './AssigneesSelector.module.scss';

const USERS_CHUNK_SIZE = 10;
const POPUP_WIDTH = 420;
const POPUP_MAX_HEIGHT = 320;
const VIEWPORT_PADDING = 12;

interface AssigneesSelectorProps {
  users: readonly ProjectParticipant[];
  selectedUserIds: readonly EntityId[];
  onChange: (userIds: EntityId[]) => void;
  disabled?: boolean;
  title?: string;
}

const AssigneesSelector = ({
  users,
  selectedUserIds,
  onChange,
  disabled = false,
  title = 'Исполнители',
}: AssigneesSelectorProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({});
  const [isPopupOpenUp, setIsPopupOpenUp] = useState(false);
  const safeUsers = useMemo(() => [...users], [users]);
  const safeSelectedUserIds = useMemo(() => [...selectedUserIds], [selectedUserIds]);

  const selectedUsers = useMemo(
    () =>
      safeUsers
        .filter((user) => safeSelectedUserIds.includes(user.id))
        .sort((left, right) =>
          (left.fullName ?? left.login).localeCompare(right.fullName ?? right.login, 'ru', {
            sensitivity: 'base',
          })
        ),
    [safeSelectedUserIds, safeUsers]
  );

  const availableUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return safeUsers
      .filter((user) => !safeSelectedUserIds.includes(user.id))
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          (user.fullName ?? '').toLowerCase().includes(normalizedSearch) ||
          user.login.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) =>
        (left.fullName ?? left.login).localeCompare(right.fullName ?? right.login, 'ru', {
          sensitivity: 'base',
        })
      );
  }, [safeSelectedUserIds, safeUsers, search]);

  const { visibleItems, hasMore, sentinelRef } = useVisibleItems(availableUsers, USERS_CHUNK_SIZE);

  const recalculatePopupPosition = useCallback(() => {
    const rootElement = rootRef.current;
    const triggerElement = triggerRef.current;

    if (!rootElement || !triggerElement) {
      return;
    }

    const rootRect = rootElement.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();
    const width = Math.min(POPUP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);

    const leftInViewport = Math.min(
      window.innerWidth - width - VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, triggerRect.left + triggerRect.width - width)
    );

    const left = leftInViewport + triggerRect.width / 2;
    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING;
    const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
    const shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableHeight = shouldOpenUp ? spaceAbove - 8 : spaceBelow - 8;
    const maxHeight = Math.max(120, Math.min(POPUP_MAX_HEIGHT, availableHeight));
    setIsPopupOpenUp(shouldOpenUp);

    setPopupStyle(
      shouldOpenUp
        ? {
            top: 'auto',
            bottom: `${rootRect.bottom - triggerRect.top + 8}px`,
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${maxHeight}px`,
          }
        : {
            top: `${triggerRect.bottom - rootRect.top + 8}px`,
            bottom: 'auto',
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${maxHeight}px`,
          }
    );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const isInsidePopup = popupRef.current?.contains(target);
      const isTrigger = triggerRef.current?.contains(target);

      if (!isInsidePopup && !isTrigger) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const frameId = window.requestAnimationFrame(() => {
      recalculatePopupPosition();
    });

    const handleViewportChange = () => {
      recalculatePopupPosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, recalculatePopupPosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      recalculatePopupPosition();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen, selectedUserIds, search, recalculatePopupPosition]);

  const toggleUser = (userId: EntityId) => {
    if (disabled) {
      return;
    }

    if (safeSelectedUserIds.includes(userId)) {
      onChange(safeSelectedUserIds.filter((id) => id !== userId));

      return;
    }

    onChange([...safeSelectedUserIds, userId]);
  };

  const clearAll = () => {
    if (disabled || safeSelectedUserIds.length === 0) {
      return;
    }

    onChange([]);
  };

  return (
    <div className={assigneesSelectorStyles.root} ref={rootRef}>
      <div className={assigneesSelectorStyles.head}>
        <h3 className={assigneesSelectorStyles.title}>{title}</h3>
        <button
          className={assigneesSelectorStyles.clear}
          type="button"
          onClick={clearAll}
          disabled={disabled || safeSelectedUserIds.length === 0}
        >
          Очистить все
        </button>
      </div>

      <div className={assigneesSelectorStyles.selectedList}>
        {selectedUsers.map((user) => (
          <button
            key={user.id}
            className={assigneesSelectorStyles.selectedItem}
            type="button"
            onClick={() => toggleUser(user.id)}
            disabled={disabled}
          >
            {user.avatar ? <img src={user.avatar} alt={user.fullName ?? user.login} /> : <AvatarIcon />}
            <span>{user.fullName ?? user.login}</span>
          </button>
        ))}

        {selectedUsers.length === 0 && <span className={assigneesSelectorStyles.isEmpty}>Не выбрано</span>}
        <button
          ref={triggerRef}
          className={assigneesSelectorStyles.isOpen}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
        >
          +
        </button>
      </div>

      {isOpen && (
        <div
          ref={popupRef}
          className={[assigneesSelectorStyles.popup, isPopupOpenUp ? assigneesSelectorStyles.isTop : '']
            .filter(Boolean)
            .join(' ')}
          role="dialog"
          aria-label={`Выбор: ${title.toLowerCase()}`}
          style={popupStyle}
        >
          <input
            className={assigneesSelectorStyles.search}
            type="text"
            placeholder="Поиск по имени или логину"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value.slice(0, 100))}
          />

          <div className={assigneesSelectorStyles.users}>
            {visibleItems.map((user) => (
              <button
                className={assigneesSelectorStyles.user}
                key={user.id}
                type="button"
                onClick={() => toggleUser(user.id)}
              >
                <span className={assigneesSelectorStyles.avatar}>
                  {user.avatar ? <img src={user.avatar} alt={user.fullName ?? user.login} /> : <AvatarIcon />}
                </span>
                <span className={assigneesSelectorStyles.meta}>
                  <span className={assigneesSelectorStyles.name}>{user.fullName ?? user.login}</span>
                  <span className={assigneesSelectorStyles.login}>@{user.login}</span>
                </span>
              </button>
            ))}

            {visibleItems.length === 0 && <p className={assigneesSelectorStyles.notFound}>Ничего не найдено</p>}
            {hasMore && <div ref={sentinelRef} className={assigneesSelectorStyles.sentinel} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssigneesSelector;

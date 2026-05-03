import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AvatarIcon } from '../Icons/Icons';
import { useVisibleItems } from '../../hooks/useVisibleItems';
import './AssigneesSelector.css';

const USERS_CHUNK_SIZE = 10;
const POPUP_WIDTH = 420;
const POPUP_MAX_HEIGHT = 320;
const VIEWPORT_PADDING = 12;

const AssigneesSelector = ({ users, selectedUserIds, onChange, disabled = false, title = 'Исполнители' }) => {
  const rootRef = useRef(null);
  const popupRef = useRef(null);
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popupStyle, setPopupStyle] = useState({});
  const [isPopupOpenUp, setIsPopupOpenUp] = useState(false);

  const selectedUsers = useMemo(
    () => users
      .filter((user) => selectedUserIds.includes(user.id))
      .sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru', { sensitivity: 'base' })),
    [selectedUserIds, users]
  );

  const availableUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users
      .filter((user) => !selectedUserIds.includes(user.id))
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        return user.fullName.toLowerCase().includes(normalizedSearch) || user.login.toLowerCase().includes(normalizedSearch);
      })
      .sort((left, right) => left.fullName.localeCompare(right.fullName, 'ru', { sensitivity: 'base' }));
  }, [search, selectedUserIds, users]);

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
            maxHeight: `${maxHeight}px`
          }
        : {
            top: `${triggerRect.bottom - rootRect.top + 8}px`,
            bottom: 'auto',
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${maxHeight}px`
          }
    );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      const target = event.target;
      const isInsidePopup = popupRef.current?.contains(target);
      const isTrigger = triggerRef.current?.contains(target);

      if (!isInsidePopup && !isTrigger) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
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

  const toggleUser = (userId) => {
    if (disabled) {
      return;
    }

    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
      return;
    }

    onChange([...selectedUserIds, userId]);
  };

  const clearAll = () => {
    if (disabled || selectedUserIds.length === 0) {
      return;
    }

    onChange([]);
  };

  return (
    <div className="assignees-selector" ref={rootRef}>
      <div className="assignees-selector__head">
        <h3 className="assignees-selector__title">{title}</h3>
        <button className="assignees-selector__clear" type="button" onClick={clearAll} disabled={disabled || selectedUserIds.length === 0}>
          Очистить все
        </button>
      </div>

      <div className="assignees-selector__selected-list">
        {selectedUsers.map((user) => (
          <button key={user.id} className="assignees-selector__selected-item" type="button" onClick={() => toggleUser(user.id)} disabled={disabled}>
            {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <AvatarIcon />}
            <span>{user.fullName}</span>
          </button>
        ))}

        {selectedUsers.length === 0 && <span className="assignees-selector__empty">Не выбрано</span>}
        <button
          ref={triggerRef}
          className="assignees-selector__open"
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
          className={`assignees-selector__popup ${isPopupOpenUp ? 'assignees-selector__popup--top' : ''}`}
          role="dialog"
          aria-label={`Выбор: ${title.toLowerCase()}`}
          style={popupStyle}
        >
          <input
            className="assignees-selector__search"
            type="text"
            placeholder="Поиск по имени или логину"
            value={search}
            onChange={(event) => setSearch(event.target.value.slice(0, 100))}
          />

          <div className="assignees-selector__users">
            {visibleItems.map((user) => (
              <button className="assignees-selector__user" key={user.id} type="button" onClick={() => toggleUser(user.id)}>
                <span className="assignees-selector__avatar">{user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <AvatarIcon />}</span>
                <span className="assignees-selector__meta">
                  <span className="assignees-selector__name">{user.fullName}</span>
                  <span className="assignees-selector__login">@{user.login}</span>
                </span>
              </button>
            ))}

            {visibleItems.length === 0 && <p className="assignees-selector__not-found">Ничего не найдено</p>}
            {hasMore && <div ref={sentinelRef} className="assignees-selector__sentinel" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssigneesSelector;

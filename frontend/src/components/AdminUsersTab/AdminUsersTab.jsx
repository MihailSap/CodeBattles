import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Spinner from '../Spinner/Spinner';
import ConfirmActionModal from '../ConfirmActionModal/ConfirmActionModal';
import { userApi } from '../../api/userApi';
import { getApiErrorMessage } from '../../utils/apiErrors';
import './AdminUsersTab.css';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 450;

const AdminUsersTab = ({ isActive, currentUserId, onSelfDemote, onSelfDelete }) => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const prevSearchRef = useRef(debouncedSearch);

  const loadUsers = useCallback(
    async (targetPage, filter) => {
      setIsLoading(true);
      setError('');

      try {
        const response = await userApi.getAll({
          page: targetPage,
          size: PAGE_SIZE,
          filter: filter || undefined
        });

        const content = Array.isArray(response.data?.content) ? response.data.content : [];
        const backendTotalPages = Number.isFinite(response.data?.totalPages) ? response.data.totalPages : 0;
        const backendPage = Number.isFinite(response.data?.page) ? response.data.page : targetPage;

        setUsers(content);
        setTotalPages(backendTotalPages);
        setPage(backendPage);

        if (backendTotalPages > 0 && backendPage >= backendTotalPages) {
          setPage(backendTotalPages - 1);
        }
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, 'Не удалось загрузить пользователей', 'getUsers'));
        setUsers([]);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const searchChanged = prevSearchRef.current !== debouncedSearch;
    prevSearchRef.current = debouncedSearch;

    if (searchChanged && page !== 0) {
      setPage(0);
      return;
    }

    loadUsers(page, debouncedSearch);
  }, [page, debouncedSearch, isActive, loadUsers]);

  const openDeleteConfirm = (targetUser) => {
    setConfirmState({
      type: 'delete',
      targetUser
    });
  };

  const openRoleConfirm = (targetUser, shouldBeAdmin) => {
    setConfirmState({
      type: 'role',
      targetUser,
      shouldBeAdmin
    });
  };

  const closeConfirm = () => {
    if (!isSubmittingAction) {
      setConfirmState(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) {
      return;
    }

    setIsSubmittingAction(true);

    try {
      if (confirmState.type === 'delete') {
        await userApi.delete(confirmState.targetUser.id);

        if (confirmState.targetUser.id === currentUserId) {
          await onSelfDelete();
          return;
        }
      }

      if (confirmState.type === 'role') {
        if (confirmState.shouldBeAdmin) {
          await userApi.makeAdmin(confirmState.targetUser.id);
        } else {
          await userApi.makeNotAdmin(confirmState.targetUser.id);
        }

        if (confirmState.targetUser.id === currentUserId && !confirmState.shouldBeAdmin) {
          await onSelfDemote();
          return;
        }
      }

      await loadUsers(page, debouncedSearch);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не удалось выполнить действие', 'adminUserAction'));
    } finally {
      setIsSubmittingAction(false);
      setConfirmState(null);
    }
  };

  const currentPageLabel = useMemo(() => {
    if (totalPages < 1) {
      return '0/0';
    }

    return `${page + 1}/${totalPages}`;
  }, [page, totalPages]);

  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;
  const hasUsers = users.length > 0;

  return (
    <section className="admin-users" aria-label="Управление пользователями">
      <div className="admin-users__top">
        <h2 className="admin-users__title">Пользователи</h2>
        <label className="admin-users__search-wrap">
          <input
            className="admin-users__search-input"
            type="text"
            placeholder="Введите логин или E-Mail"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
      </div>

      <div className="admin-users__table-wrap">
        <table className="admin-users__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>E-Mail</th>
              <th>Админ</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="admin-users__loading-cell" colSpan={5}>
                  <div className="admin-users__table-loader">
                    <Spinner />
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !hasUsers && (
              <tr>
                <td className="admin-users__empty-cell" colSpan={5}>
                  Пользователи для отображения не найдены
                </td>
              </tr>
            )}

            {!isLoading &&
              hasUsers &&
              users.map((targetUser) => {
                const isAdmin = targetUser.role === 'ADMIN';
                const isCurrentUser = targetUser.id === currentUserId;

                return (
                  <tr
                    key={targetUser.id}
                    className={`admin-users__row ${isAdmin ? 'admin-users__row--admin' : ''} ${isCurrentUser ? 'admin-users__row--me' : ''}`}
                  >
                    <td>{targetUser.id}</td>
                    <td>{targetUser.login || '—'}</td>
                    <td>{targetUser.email || '—'}</td>
                    <td>
                      <input
                        className="admin-users__checkbox"
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(event) => {
                          openRoleConfirm(targetUser, event.target.checked);
                        }}
                        disabled={isSubmittingAction}
                      />
                    </td>
                    <td>
                      <div className="admin-users__actions">
                        <button
                          className="admin-users__action-button admin-users__action-button--delete"
                          type="button"
                          aria-label={`Удалить пользователя ${targetUser.login || targetUser.id}`}
                          onClick={() => openDeleteConfirm(targetUser)}
                          disabled={isSubmittingAction}
                        >
                          ×
                        </button>
                        {!targetUser.enabled && (
                          <button
                            className="admin-users__action-button admin-users__action-button--approve"
                            type="button"
                            aria-label={`Подтвердить пользователя ${targetUser.login || targetUser.id}`}
                            disabled
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {error && <p className="admin-users__error">{error}</p>}

      <div className="admin-users__pagination">
        <button
          className="admin-users__pagination-button"
          type="button"
          onClick={() => setPage((currentPage) => currentPage - 1)}
          disabled={!canGoPrev || isLoading}
        >
          ←
        </button>
        <p className="admin-users__pagination-label">{currentPageLabel}</p>
        <button
          className="admin-users__pagination-button"
          type="button"
          onClick={() => setPage((currentPage) => currentPage + 1)}
          disabled={!canGoNext || isLoading}
        >
          →
        </button>
      </div>

      <ConfirmActionModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.type === 'delete' ? 'Удалить пользователя?' : confirmState?.shouldBeAdmin ? 'Назначить пользователю роль администратора?' : 'Снять с пользователя роль администратора?'}
        description={
          confirmState?.type === 'delete'
            ? 'Пользователь будет удален из системы. Это действие нельзя отменить.'
            : confirmState?.shouldBeAdmin
              ? 'Пользователь получит роль администратора.'
              : 'У пользователя будет снята роль администратора.'
        }
        confirmLabel={confirmState?.type === 'delete' ? 'Удалить' : 'Да'}
        onCancel={closeConfirm}
        onConfirm={handleConfirmAction}
        isSubmitting={isSubmittingAction}
      />
    </section>
  );
};

export default AdminUsersTab;

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import Spinner from '@/shared/ui/spinner';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import Snackbar from '@/shared/ui/snackbar';
import {
  useDeleteUserMutation,
  useEnableUserMutation,
  useGetUsersQuery,
  useMakeAdminMutation,
  useMakeNotAdminMutation,
} from '@/entities/user';
import type { User } from '@/entities/user';
import type { EntityId } from '@/entities/project';
import { useSnackbar } from '@/shared/lib/hooks';
import { getApiErrorMessage } from '@/shared/lib';
import adminUsersTabStyles from './AdminUsersTab.module.scss';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 450;

type ConfirmState =
  | { type: 'delete'; targetUser: User }
  | { type: 'role'; targetUser: User; shouldBeAdmin: boolean }
  | { type: 'enable'; targetUser: User };

interface AdminUsersTabProps {
  isActive: boolean;
  currentUserId: EntityId | null;
  onSelfDemote: () => void | Promise<void>;
  onSelfDelete: () => void | Promise<void>;
}

const AdminUsersTab = ({ isActive, currentUserId, onSelfDemote, onSelfDelete }: AdminUsersTabProps) => {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const usersQueryParams: {
    page: number;
    size: number;
    filter?: string;
  } = {
    page,
    size: PAGE_SIZE,
  };

  if (debouncedSearch) {
    usersQueryParams.filter = debouncedSearch;
  }

  const usersQuery = useGetUsersQuery(usersQueryParams, {
    skip: !isActive,
    refetchOnMountOrArgChange: 30,
  });

  const [deleteUser, deleteUserState] = useDeleteUserMutation();
  const [makeAdmin, makeAdminState] = useMakeAdminMutation();
  const [makeNotAdmin, makeNotAdminState] = useMakeNotAdminMutation();
  const [enableUser, enableUserState] = useEnableUserMutation();
  const users = Array.isArray(usersQuery.data?.content) ? usersQuery.data.content : [];
  const totalPages = Number.isFinite(usersQuery.data?.totalPages) ? Number(usersQuery.data?.totalPages ?? 0) : 0;
  const isLoading = usersQuery.isLoading || usersQuery.isFetching;

  const isSubmittingAction =
    deleteUserState.isLoading || makeAdminState.isLoading || makeNotAdminState.isLoading || enableUserState.isLoading;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
      setError('');
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (usersQuery.isError) {
      setError(getApiErrorMessage(usersQuery.error, 'Не удалось загрузить пользователей', 'getUsers'));
    }
  }, [usersQuery.error, usersQuery.isError]);

  const openDeleteConfirm = (targetUser: User) => {
    setConfirmState({
      type: 'delete',
      targetUser,
    });
  };

  const openRoleConfirm = (targetUser: User, shouldBeAdmin: boolean) => {
    setConfirmState({
      type: 'role',
      targetUser,
      shouldBeAdmin,
    });
  };

  const openEnableConfirm = (targetUser: User) => {
    setConfirmState({
      type: 'enable',
      targetUser,
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

    try {
      if (confirmState.type === 'delete') {
        await deleteUser(confirmState.targetUser.id).unwrap();

        if (confirmState.targetUser.id === currentUserId) {
          await onSelfDelete();

          return;
        }

        showSnackbar('Пользователь удален', 'success');
      }

      if (confirmState.type === 'role') {
        if (confirmState.shouldBeAdmin) {
          await makeAdmin(confirmState.targetUser.id).unwrap();
        } else {
          await makeNotAdmin(confirmState.targetUser.id).unwrap();
        }

        if (confirmState.targetUser.id === currentUserId && !confirmState.shouldBeAdmin) {
          await onSelfDemote();

          return;
        }

        showSnackbar(
          confirmState.shouldBeAdmin ? 'Пользователь назначен администратором' : 'Роль администратора снята',
          'success'
        );
      }

      if (confirmState.type === 'enable') {
        await enableUser(confirmState.targetUser.id).unwrap();
        showSnackbar('Почта пользователя подтверждена', 'success');
      }
    } catch (requestError: unknown) {
      const message = getApiErrorMessage(requestError, 'Не удалось выполнить действие', 'adminUserAction');
      setError(message);
      showSnackbar(message, 'error');
    } finally {
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
    <section className={adminUsersTabStyles.root} aria-label="Управление пользователями">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <div className={adminUsersTabStyles.top}>
        <h2 className={adminUsersTabStyles.title}>Пользователи</h2>
        <label className={adminUsersTabStyles.searchWrap}>
          <input
            className={adminUsersTabStyles.searchInput}
            type="text"
            placeholder="Введите логин или E-Mail"
            value={searchInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchInput(event.target.value)}
          />
        </label>
      </div>

      <div className={adminUsersTabStyles.tableWrap}>
        <table className={adminUsersTabStyles.table}>
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
                <td className={adminUsersTabStyles.loadingCell} colSpan={5}>
                  <div className={adminUsersTabStyles.tableLoader}>
                    <Spinner />
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !hasUsers && (
              <tr>
                <td className={adminUsersTabStyles.emptyCell} colSpan={5}>
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
                    className={[
                      adminUsersTabStyles.row,
                      isAdmin ? adminUsersTabStyles.isAdmin : '',
                      isCurrentUser ? adminUsersTabStyles.isMe : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <td>{targetUser.id}</td>
                    <td>{targetUser.login || '—'}</td>
                    <td>{targetUser.email || '—'}</td>
                    <td>
                      <input
                        className={adminUsersTabStyles.checkbox}
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          openRoleConfirm(targetUser, event.target.checked);
                        }}
                        disabled={isSubmittingAction}
                      />
                    </td>
                    <td>
                      <div className={adminUsersTabStyles.actions}>
                        {!targetUser.enabled && (
                          <button
                            className={[adminUsersTabStyles.actionButton, adminUsersTabStyles.isApprove].join(' ')}
                            type="button"
                            aria-label={`Подтвердить пользователя ${targetUser.login || targetUser.id}`}
                            onClick={() => openEnableConfirm(targetUser)}
                            disabled={isSubmittingAction}
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className={[adminUsersTabStyles.actionButton, adminUsersTabStyles.isDelete].join(' ')}
                          type="button"
                          aria-label={`Удалить пользователя ${targetUser.login || targetUser.id}`}
                          onClick={() => openDeleteConfirm(targetUser)}
                          disabled={isSubmittingAction}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {error && <p className={adminUsersTabStyles.isError}>{error}</p>}

      <div className={adminUsersTabStyles.pagination}>
        <button
          className={adminUsersTabStyles.paginationButton}
          type="button"
          onClick={() => setPage((currentPage) => currentPage - 1)}
          disabled={!canGoPrev || isLoading}
        >
          ←
        </button>
        <p className={adminUsersTabStyles.paginationLabel}>{currentPageLabel}</p>
        <button
          className={adminUsersTabStyles.paginationButton}
          type="button"
          onClick={() => setPage((currentPage) => currentPage + 1)}
          disabled={!canGoNext || isLoading}
        >
          →
        </button>
      </div>

      <ConfirmActionModal
        isOpen={Boolean(confirmState)}
        title={
          confirmState?.type === 'delete'
            ? 'Удалить пользователя?'
            : confirmState?.type === 'enable'
              ? 'Подтвердить почту пользователя?'
              : confirmState?.shouldBeAdmin
                ? 'Назначить пользователю роль администратора?'
                : 'Снять с пользователя роль администратора?'
        }
        description={
          confirmState?.type === 'delete'
            ? 'Пользователь будет удален из системы. Это действие нельзя отменить.'
            : confirmState?.type === 'enable'
              ? 'Почта пользователя будет принудительно подтверждена.'
              : confirmState?.shouldBeAdmin
                ? 'Пользователь получит роль администратора.'
                : 'У пользователя будет снята роль администратора.'
        }
        confirmLabel={confirmState?.type === 'delete' ? 'Удалить' : 'Подтвердить'}
        onCancel={closeConfirm}
        onConfirm={handleConfirmAction}
        isSubmitting={isSubmittingAction}
        isDeleteAction={confirmState?.type === 'delete'}
      />
    </section>
  );
};

export default AdminUsersTab;

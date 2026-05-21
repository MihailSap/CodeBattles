import adminUsersTabStyles from '../../manage-users/ui/admin-users-tab/AdminUsersTab.module.scss';

const AdminPagination = ({ page, totalPages, isLoading = false, onChange }) => {
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;
  const currentPageLabel = totalPages < 1 ? '0/0' : `${page + 1}/${totalPages}`;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={adminUsersTabStyles.pagination} aria-label="Пагинация">
      <button
        className={adminUsersTabStyles.paginationButton}
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={!canGoPrev || isLoading}
        aria-label="Предыдущая страница"
      >
        ←
      </button>

      <p className={adminUsersTabStyles.paginationLabel}>{currentPageLabel}</p>

      <button
        className={adminUsersTabStyles.paginationButton}
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={!canGoNext || isLoading}
        aria-label="Следующая страница"
      >
        →
      </button>
    </div>
  );
};

export default AdminPagination;

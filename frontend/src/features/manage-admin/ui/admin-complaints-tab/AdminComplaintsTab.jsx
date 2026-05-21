import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ADMIN_COMPLAINT_DECISION,
  useGetAdminComplaintsQuery,
  useResolveAdminComplaintMutation,
} from '@/entities/admin';
import Spinner from '@/shared/ui/spinner';
import { CheckIcon, CrossIcon } from '@/shared/ui/icons';
import Snackbar from '@/shared/ui/snackbar';
import { useSnackbar } from '@/shared/lib/hooks';
import { ROUTES } from '@/shared/config/routes';
import { getApiErrorMessage } from '@/shared/lib';
import { formatAdminDateTime } from '../../lib/pagination';
import AdminPagination from '../AdminPagination';
import './AdminComplaintsTab.css';

const PAGE_SIZE = 5;

const getProfileUrl = (userId) => ROUTES.profileByUserId.replace(':userId', userId);

const AdminComplaintsTab = ({ isActive, moderator }) => {
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState('');
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const complaintsQuery = useGetAdminComplaintsQuery(
    { page, size: PAGE_SIZE },
    {
      skip: !isActive,
      refetchOnMountOrArgChange: 30,
    }
  );
  const [resolveComplaint, resolveComplaintState] = useResolveAdminComplaintMutation();

  const complaints = Array.isArray(complaintsQuery.data?.content) ? complaintsQuery.data.content : [];
  const totalPages = Number.isFinite(complaintsQuery.data?.totalPages) ? complaintsQuery.data.totalPages : 0;
  const isLoading = complaintsQuery.isLoading || complaintsQuery.isFetching;
  const isSubmitting = resolveComplaintState.isLoading;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      queueMicrotask(() => setPage(totalPages - 1));
    }
  }, [page, totalPages]);

  const hasComplaints = complaints.length > 0;
  const totalElements = Number.isFinite(complaintsQuery.data?.totalElements) ? complaintsQuery.data.totalElements : 0;
  const summary = totalElements === 1 ? '1 активная жалоба' : `${totalElements} активных жалоб`;
  const queryError = complaintsQuery.isError
    ? getApiErrorMessage(complaintsQuery.error, 'Не удалось загрузить жалобы', 'getAdminComplaints')
    : '';
  const error = actionError || queryError;

  const handleDecision = async (complaintId, decision) => {
    setActionError('');

    try {
      await resolveComplaint({
        complaintId,
        payload: {
          decision,
          moderator,
        },
      }).unwrap();
      showSnackbar(
        decision === ADMIN_COMPLAINT_DECISION.APPROVE
          ? 'Жалоба подтверждена, решение записано в журнал'
          : 'Жалоба отклонена, решение записано в журнал',
        'success'
      );
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Не удалось обработать жалобу', 'resolveAdminComplaint');
      setActionError(message);
      showSnackbar(message, 'error');
    }
  };

  return (
    <section className="admin-panel admin-complaints" aria-label="Жалобы на комментарии">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <div className="admin-panel__top">
        <div>
          <h2 className="admin-panel__title">Жалобы</h2>
          <p className="admin-panel__subtitle">{summary}</p>
        </div>
      </div>

      <div className="admin-complaints__list">
        {isLoading && (
          <div className="admin-panel__loader">
            <Spinner />
          </div>
        )}

        {!isLoading && !hasComplaints && <div className="admin-panel__empty">Активных жалоб нет</div>}

        {!isLoading &&
          hasComplaints &&
          complaints.map((complaint) => (
            <article className="admin-complaints__item" key={complaint.id}>
              <div className="admin-complaints__body">
                <div className="admin-complaints__comment">
                  <span className="admin-complaints__label">Комментарий</span>
                  <p>{complaint.commentText}</p>
                </div>

                <dl className="admin-complaints__meta">
                  <div>
                    <dt>Автор</dt>
                    <dd>
                      <Link to={getProfileUrl(complaint.commentAuthor.id)}>
                        {complaint.commentAuthor.fullName} <span>@{complaint.commentAuthor.login}</span>
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Жалобу отправил</dt>
                    <dd>
                      <Link to={getProfileUrl(complaint.reportedBy.id)}>
                        {complaint.reportedBy.fullName} <span>@{complaint.reportedBy.login}</span>
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Где</dt>
                    <dd>
                      <Link to={complaint.target.url}>{complaint.target.title}</Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Причина</dt>
                    <dd>{complaint.reason}</dd>
                  </div>
                  <div>
                    <dt>Поступила</dt>
                    <dd>{formatAdminDateTime(complaint.createdAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-complaints__actions">
                <button
                  className="admin-complaints__action admin-complaints__action--approve"
                  type="button"
                  onClick={() => handleDecision(complaint.id, ADMIN_COMPLAINT_DECISION.APPROVE)}
                  disabled={isSubmitting}
                  aria-label={`Подтвердить жалобу ${complaint.id}`}
                >
                  <CheckIcon />
                  <span>Подтвердить</span>
                </button>
                <button
                  className="admin-complaints__action admin-complaints__action--reject"
                  type="button"
                  onClick={() => handleDecision(complaint.id, ADMIN_COMPLAINT_DECISION.REJECT)}
                  disabled={isSubmitting}
                  aria-label={`Отклонить жалобу ${complaint.id}`}
                >
                  <CrossIcon />
                  <span>Отклонить</span>
                </button>
              </div>
            </article>
          ))}
      </div>

      {error && <p className="admin-panel__error">{error}</p>}

      <AdminPagination page={page} totalPages={totalPages} isLoading={isLoading || isSubmitting} onChange={setPage} />
    </section>
  );
};

export default AdminComplaintsTab;

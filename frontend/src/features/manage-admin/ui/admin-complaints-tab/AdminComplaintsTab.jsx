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
import adminComplaintsTabStyles from './AdminComplaintsTab.module.scss';
const PAGE_SIZE = 5;
const getProfileUrl = (userId) => ROUTES.profileByUserId.replace(':userId', userId);

const AdminComplaintsTab = ({ isActive, moderator }) => {
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState('');
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const complaintsQuery = useGetAdminComplaintsQuery(
    {
      page,
      size: PAGE_SIZE,
    },
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
    <section className={adminComplaintsTabStyles.root} aria-label="Жалобы на комментарии">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <div className={adminComplaintsTabStyles.top}>
        <div>
          <h2 className={adminComplaintsTabStyles.title}>Жалобы</h2>
          <p className={adminComplaintsTabStyles.subtitle}>{summary}</p>
        </div>
      </div>

      <div className={adminComplaintsTabStyles.list}>
        {isLoading && (
          <div className={adminComplaintsTabStyles.loader}>
            <Spinner />
          </div>
        )}

        {!isLoading && !hasComplaints && <div className={adminComplaintsTabStyles.isEmpty}>Активных жалоб нет</div>}

        {!isLoading &&
          hasComplaints &&
          complaints.map((complaint) => (
            <article className={adminComplaintsTabStyles.item} key={complaint.id}>
              <div className={adminComplaintsTabStyles.body}>
                <div className={adminComplaintsTabStyles.comment}>
                  <span className={adminComplaintsTabStyles.label}>Комментарий</span>
                  <p>{complaint.commentText}</p>
                </div>

                <dl className={adminComplaintsTabStyles.meta}>
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

              <div className={adminComplaintsTabStyles.actions}>
                <button
                  className={[adminComplaintsTabStyles.action, adminComplaintsTabStyles.isApprove].join(' ')}
                  type="button"
                  onClick={() => handleDecision(complaint.id, ADMIN_COMPLAINT_DECISION.APPROVE)}
                  disabled={isSubmitting}
                  aria-label={`Подтвердить жалобу ${complaint.id}`}
                >
                  <CheckIcon />
                  <span>Подтвердить</span>
                </button>
                <button
                  className={[adminComplaintsTabStyles.action, adminComplaintsTabStyles.isReject].join(' ')}
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

      {error && <p className={adminComplaintsTabStyles.isError}>{error}</p>}

      <AdminPagination page={page} totalPages={totalPages} isLoading={isLoading || isSubmitting} onChange={setPage} />
    </section>
  );
};

export default AdminComplaintsTab;

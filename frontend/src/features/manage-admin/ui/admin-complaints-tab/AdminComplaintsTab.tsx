import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ADMIN_COMPLAINT_DECISION,
  ADMIN_COMPLAINT_REASON_LABELS,
  useGetAdminComplaintsQuery,
  useResolveAdminComplaintMutation,
} from '@/entities/admin';
import type { AdminCommentComplaint, AdminComplaintDecision } from '@/entities/admin';
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
const getProfileUrl = (userId: number) => ROUTES.profileByUserId.replace(':userId', String(userId));

const getComplaintTargetLink = (target: AdminCommentComplaint['target']) => {
  const targetTitle = target.title || 'Без названия';

  if (target.kind === 'review' && target.reviewId !== null) {
    return {
      title: `${targetTitle} (Ревью)`,
      url: ROUTES.reviewById.replace(':reviewId', String(target.reviewId)),
    };
  }

  if (target.projectId !== null && target.taskId !== null) {
    return {
      title: `${targetTitle} (Задача)`,
      url: ROUTES.projectTaskById
        .replace(':projectId', String(target.projectId))
        .replace(':taskId', String(target.taskId)),
    };
  }

  if (target.reviewId !== null) {
    return {
      title: `${targetTitle} (Ревью)`,
      url: ROUTES.reviewById.replace(':reviewId', String(target.reviewId)),
    };
  }

  return null;
};

interface AdminComplaintsTabProps {
  isActive: boolean;
}

const AdminComplaintsTab = ({ isActive }: AdminComplaintsTabProps) => {
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState('');
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const complaintsQuery = useGetAdminComplaintsQuery(undefined, {
    skip: !isActive,
    refetchOnMountOrArgChange: true,
  });

  const [resolveComplaint, resolveComplaintState] = useResolveAdminComplaintMutation();
  const allComplaints = complaintsQuery.data ?? [];
  const totalPages = Math.ceil(allComplaints.length / PAGE_SIZE);
  const complaints = allComplaints.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isLoading = complaintsQuery.isLoading || complaintsQuery.isFetching;
  const isSubmitting = resolveComplaintState.isLoading;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      queueMicrotask(() => setPage(totalPages - 1));
    }
  }, [page, totalPages]);

  const hasComplaints = complaints.length > 0;
  const totalElements = allComplaints.length;
  const summary = totalElements === 1 ? '1 активная жалоба' : `${totalElements} активных жалоб`;

  const queryError = complaintsQuery.isError
    ? getApiErrorMessage(complaintsQuery.error, 'Не удалось загрузить жалобы', 'getAdminComplaints')
    : '';

  const error = actionError || queryError;

  const handleDecision = async (complaintId: number, decision: AdminComplaintDecision) => {
    setActionError('');

    try {
      await resolveComplaint({
        complaintId,
        payload: {
          decision,
        },
      }).unwrap();

      showSnackbar(
        decision === ADMIN_COMPLAINT_DECISION.APPROVE ? 'Жалоба подтверждена' : 'Жалоба отклонена',
        'success'
      );
    } catch (requestError: unknown) {
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
          complaints.map((complaint: AdminCommentComplaint) => {
            const targetLink = getComplaintTargetLink(complaint.target);

            return (
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
                      <dd>{targetLink ? <Link to={targetLink.url}>{targetLink.title}</Link> : '—'}</dd>
                    </div>
                    <div>
                      <dt>Причина</dt>
                      <dd>{ADMIN_COMPLAINT_REASON_LABELS[complaint.reason]}</dd>
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
            );
          })}
      </div>

      {error && <p className={adminComplaintsTabStyles.isError}>{error}</p>}

      <AdminPagination page={page} totalPages={totalPages} isLoading={isLoading || isSubmitting} onChange={setPage} />
    </section>
  );
};

export default AdminComplaintsTab;

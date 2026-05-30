import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ADMIN_EVENT_TYPE,
  ADMIN_EVENT_TYPE_LABELS,
  ADMIN_EVENT_TYPE_OPTIONS,
  useGetAdminEventsQuery,
} from '@/entities/admin';
import type { AdminEvent, AdminEventType, AdminUserBrief } from '@/entities/admin';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import Spinner from '@/shared/ui/spinner';
import { ROUTES } from '@/shared/config/routes';
import { getApiErrorMessage } from '@/shared/lib';
import { formatAdminDateTime } from '../../lib/pagination';
import AdminPagination from '../AdminPagination';
import adminEventsLogTabStyles from './AdminEventsLogTab.module.scss';
import adminComplaintsTabStyles from '../admin-complaints-tab/AdminComplaintsTab.module.scss';

const PAGE_SIZE = 8;

const EVENT_TYPE_CLASS = {
  [ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_CREATED]: adminEventsLogTabStyles.isCommentComplaintCreated,
  [ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_APPROVED]: adminEventsLogTabStyles.isCommentComplaintApproved,
  [ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_REJECTED]: adminEventsLogTabStyles.isCommentComplaintRejected,
  [ADMIN_EVENT_TYPE.LEADERBOARD_RATING_RESET]: adminEventsLogTabStyles.isLeaderboardRatingReset,
  [ADMIN_EVENT_TYPE.SYSTEM_REVIEW_DEADLINE_CHANGED]: adminEventsLogTabStyles.isSystemReviewDeadlineChanged,
  [ADMIN_EVENT_TYPE.SYSTEM_AI_PROMPT_CHANGED]: adminEventsLogTabStyles.isSystemAiPromptChanged,
};

const getProfileUrl = (userId: number): string => ROUTES.profileByUserId.replace(':userId', String(userId));

interface UserLinkProps {
  user?: AdminUserBrief | undefined;
}

const UserLink = ({ user }: UserLinkProps) => {
  if (!user?.id) {
    return <span>{user?.fullName || user?.login || 'Система'}</span>;
  }

  return (
    <Link to={getProfileUrl(user.id)}>
      {user.fullName || user.login} <span>@{user.login}</span>
    </Link>
  );
};

interface EventFieldProps {
  label: string;
  children?: ReactNode;
  wide?: boolean;
}

const EventField = ({ label, children, wide = false }: EventFieldProps) => (
  <div
    className={[adminEventsLogTabStyles.field, wide ? adminEventsLogTabStyles.isWide : ''].filter(Boolean).join(' ')}
  >
    <dt>{label}</dt>
    <dd>{children || '—'}</dd>
  </div>
);

const renderTypedEventFields = (event: AdminEvent): ReactNode => {
  if (event.type === ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_CREATED) {
    return (
      <>
        <EventField label="Автор комментария">
          <UserLink user={event.targetUser} />
        </EventField>
        <EventField label="Где">
          {event.target?.url ? <Link to={event.target.url}>{event.target.title}</Link> : '—'}
        </EventField>
        <EventField label="Причина" wide>
          {event.reason}
        </EventField>
      </>
    );
  }

  if (event.type === ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_APPROVED) {
    return (
      <>
        <EventField label="Автор комментария">
          <UserLink user={event.targetUser} />
        </EventField>
        <EventField label="Где">
          {event.target?.url ? <Link to={event.target.url}>{event.target.title}</Link> : '—'}
        </EventField>
        <EventField label="Причина" wide>
          {event.reason}
        </EventField>
        <EventField label="Последствия" wide>
          {event.consequence}
        </EventField>
      </>
    );
  }

  if (event.type === ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_REJECTED) {
    return (
      <>
        <EventField label="Автор комментария">
          <UserLink user={event.targetUser} />
        </EventField>
        <EventField label="Где">
          {event.target?.url ? <Link to={event.target.url}>{event.target.title}</Link> : '—'}
        </EventField>
        <EventField label="Причина" wide>
          {event.reason}
        </EventField>
      </>
    );
  }

  if (event.type === ADMIN_EVENT_TYPE.LEADERBOARD_RATING_RESET) {
    return (
      <>
        <EventField label="Пользователь">
          <UserLink user={event.targetUser} />
        </EventField>
        <EventField label="Область">
          {event.scope?.url ? <Link to={event.scope.url}>{event.scope.name}</Link> : event.scope?.name}
        </EventField>
        <EventField label="Последствия" wide>
          {event.details}
        </EventField>
      </>
    );
  }

  if (
    event.type === ADMIN_EVENT_TYPE.SYSTEM_REVIEW_DEADLINE_CHANGED ||
    event.type === ADMIN_EVENT_TYPE.SYSTEM_AI_PROMPT_CHANGED
  ) {
    return (
      <>
        <EventField label="Было">
          {event.previousValue && event.previousValue.length > 119
            ? event.previousValue.slice(0, 119) + '...'
            : event.previousValue || '—'}
        </EventField>
        <EventField label="Стало">
          {event.newValue && event.newValue.length > 119 ? event.newValue.slice(0, 119) + '...' : event.newValue || '—'}
        </EventField>
      </>
    );
  }

  return (
    <EventField label="Подробности" wide>
      {event.details}
    </EventField>
  );
};

interface AdminEventsLogTabProps {
  isActive: boolean;
}

const AdminEventsLogTab = ({ isActive }: AdminEventsLogTabProps) => {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<AdminEventType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const eventsQuery = useGetAdminEventsQuery(
    {
      ...(type ? { type } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    },
    {
      skip: !isActive,
      refetchOnMountOrArgChange: 30,
    }
  );

  const allEvents = eventsQuery.data ?? [];
  const totalPages = Math.ceil(allEvents.length / PAGE_SIZE);
  const events = allEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isLoading = eventsQuery.isLoading || eventsQuery.isFetching;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      queueMicrotask(() => setPage(totalPages - 1));
    }
  }, [page, totalPages]);

  const error = eventsQuery.isError
    ? getApiErrorMessage(eventsQuery.error, 'Не удалось загрузить журнал событий', 'getAdminEvents')
    : '';

  return (
    <section className={adminComplaintsTabStyles.root} aria-label="Журнал событий">
      <div>
        <h2 className={adminComplaintsTabStyles.title}>Журнал событий</h2>
      </div>

      <div className={adminEventsLogTabStyles.filters}>
        <ReviewDropdown
          label="Тип"
          value={type}
          options={ADMIN_EVENT_TYPE_OPTIONS}
          rootClassName={adminEventsLogTabStyles.typeFilter}
          labelClassName={adminEventsLogTabStyles.typeLabel}
          triggerClassName={adminEventsLogTabStyles.typeTrigger}
          menuClassName={adminEventsLogTabStyles.typeMenu}
          onChange={(nextType: string) => {
            const validType = Object.values(ADMIN_EVENT_TYPE).find((eventType) => eventType === nextType) ?? '';
            setType(validType);
            setPage(0);
          }}
        />
        <label className={adminEventsLogTabStyles.dateField}>
          <span>С даты</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setDateFrom(event.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className={adminEventsLogTabStyles.dateField}>
          <span>По дату</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setDateTo(event.target.value);
              setPage(0);
            }}
          />
        </label>
        <button
          className={adminEventsLogTabStyles.reset}
          type="button"
          onClick={() => {
            setType('');
            setDateFrom('');
            setDateTo('');
            setPage(0);
          }}
          disabled={!type && !dateFrom && !dateTo}
        >
          Сбросить
        </button>
      </div>

      <div className={adminEventsLogTabStyles.list}>
        {isLoading && (
          <div className={adminComplaintsTabStyles.loader}>
            <Spinner />
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div className={adminComplaintsTabStyles.isEmpty}>События по выбранным фильтрам не найдены</div>
        )}

        {!isLoading &&
          events.map((event: AdminEvent) => (
            <article
              className={[adminEventsLogTabStyles.item, EVENT_TYPE_CLASS[event.type]].filter(Boolean).join(' ')}
              key={event.id}
            >
              <header className={adminEventsLogTabStyles.itemHead}>
                <span className={adminEventsLogTabStyles.type}>
                  {ADMIN_EVENT_TYPE_LABELS[event.type] || event.type}
                </span>
                <time dateTime={event.createdAt}>{formatAdminDateTime(event.createdAt)}</time>
              </header>

              <dl className={adminEventsLogTabStyles.fields}>
                <EventField
                  label={event.type === ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_CREATED ? 'Жалобу отправил' : 'Кем'}
                >
                  <UserLink user={event.actor} />
                </EventField>
                {renderTypedEventFields(event)}
              </dl>
            </article>
          ))}
      </div>

      {error && <p className={adminComplaintsTabStyles.isError}>{error}</p>}

      <AdminPagination page={page} totalPages={totalPages} isLoading={isLoading} onChange={setPage} />
    </section>
  );
};

export default AdminEventsLogTab;

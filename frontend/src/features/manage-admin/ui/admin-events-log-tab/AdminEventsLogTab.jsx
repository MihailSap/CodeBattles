import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ADMIN_EVENT_TYPE,
  ADMIN_EVENT_TYPE_LABELS,
  ADMIN_EVENT_TYPE_OPTIONS,
  useGetAdminEventsQuery,
} from '@/entities/admin';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import Spinner from '@/shared/ui/spinner';
import { ROUTES } from '@/shared/config/routes';
import { getApiErrorMessage } from '@/shared/lib';
import { formatAdminDateTime } from '../../lib/pagination';
import AdminPagination from '../AdminPagination';
import './AdminEventsLogTab.css';

const PAGE_SIZE = 8;

const getProfileUrl = (userId) => ROUTES.profileByUserId.replace(':userId', userId);

const UserLink = ({ user }) => {
  if (!user?.id) {
    return <span>{user?.fullName || user?.login || 'Система'}</span>;
  }

  return (
    <Link to={getProfileUrl(user.id)}>
      {user.fullName || user.login} <span>@{user.login}</span>
    </Link>
  );
};

const EventField = ({ label, children, wide = false }) => (
  <div className={`admin-events__field ${wide ? 'admin-events__field--wide' : ''}`}>
    <dt>{label}</dt>
    <dd>{children || '—'}</dd>
  </div>
);

const renderTypedEventFields = (event) => {
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
          {event.previousValue?.length > 119 ? event.previousValue.slice(0, 119) + '...' : event.previousValue || '—'}
        </EventField>
        <EventField label="Стало">
          {event.newValue?.length > 119 ? event.newValue.slice(0, 119) + '...' : event.newValue || '—'}
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

const AdminEventsLogTab = ({ isActive }) => {
  const [page, setPage] = useState(0);
  const [type, setType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const eventsQuery = useGetAdminEventsQuery(
    {
      page,
      size: PAGE_SIZE,
      type: type || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    {
      skip: !isActive,
      refetchOnMountOrArgChange: 30,
    }
  );

  const events = Array.isArray(eventsQuery.data?.content) ? eventsQuery.data.content : [];
  const totalPages = Number.isFinite(eventsQuery.data?.totalPages) ? eventsQuery.data.totalPages : 0;
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
    <section className="admin-panel admin-events" aria-label="Журнал событий">
      <div>
        <h2 className="admin-panel__title">Журнал событий</h2>
      </div>

      <div className="admin-events__filters">
        <ReviewDropdown
          label="Тип"
          value={type}
          options={ADMIN_EVENT_TYPE_OPTIONS}
          onChange={(nextType) => {
            setType(nextType);
            setPage(0);
          }}
        />
        <label className="admin-events__date-field">
          <span>С даты</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="admin-events__date-field">
          <span>По дату</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(0);
            }}
          />
        </label>
        <button
          className="admin-events__reset"
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

      <div className="admin-events__list">
        {isLoading && (
          <div className="admin-panel__loader">
            <Spinner />
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="admin-panel__empty">События по выбранным фильтрам не найдены</div>
        )}

        {!isLoading &&
          events.map((event) => (
            <article className={`admin-events__item admin-events__item--${event.type.toLowerCase()}`} key={event.id}>
              <header className="admin-events__item-head">
                <span className="admin-events__type">{ADMIN_EVENT_TYPE_LABELS[event.type] || event.type}</span>
                <time dateTime={event.createdAt}>{formatAdminDateTime(event.createdAt)}</time>
              </header>

              <dl className="admin-events__fields">
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

      {error && <p className="admin-panel__error">{error}</p>}

      <AdminPagination page={page} totalPages={totalPages} isLoading={isLoading} onChange={setPage} />
    </section>
  );
};

export default AdminEventsLogTab;

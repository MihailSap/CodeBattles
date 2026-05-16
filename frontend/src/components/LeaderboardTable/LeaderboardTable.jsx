import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { LEADERBOARD_METRIC_COLUMNS } from '../../constants/leaderboard';
import { ROUTES } from '../../constants/routes';
import { AvatarIcon } from '../Icons/Icons';
import './LeaderboardTable.css';

const formatMetric = (value, type) => {
  if (type === 'percent') {
    return `${Math.round(Number(value) || 0)}%`;
  }

  if (type === 'integer') {
    return String(Math.round(Number(value) || 0));
  }

  return Number(value || 0).toFixed(2);
};

const getRankClass = (rank) => {
  if (rank === 1) {
    return 'leaderboard-table__rank--gold';
  }

  if (rank === 2) {
    return 'leaderboard-table__rank--silver';
  }

  if (rank === 3) {
    return 'leaderboard-table__rank--bronze';
  }

  return '';
};

const getRowClass = ({ rank, isCurrentUser }) => {
  const classes = ['leaderboard-table__row'];

  if (rank === 1) {
    classes.push('leaderboard-table__row--gold');
  }

  if (rank === 2) {
    classes.push('leaderboard-table__row--silver');
  }

  if (rank === 3) {
    classes.push('leaderboard-table__row--bronze');
  }

  if (isCurrentUser) {
    classes.push('leaderboard-table__row--current');
  }

  return classes.join(' ');
};

const LeaderboardTable = forwardRef(({
  entries,
  currentUserEntry,
  category,
  currentUserId,
  canResetRatings,
  onResetRating
}, ref) => {
  const columns = LEADERBOARD_METRIC_COLUMNS[category];
  const tableRows = currentUserEntry ? [...entries, currentUserEntry] : entries;
  const gridTemplateColumns = `max-content minmax(max-content, 1fr) repeat(${columns.length}, max-content)${canResetRatings ? ' max-content' : ''}`;

  if (!tableRows.length) {
    return (
      <div className="leaderboard-table leaderboard-table--empty">
        Пользователи не найдены
      </div>
    );
  }

  return (
    <div className="leaderboard-table">
      <div className="leaderboard-table__scroll">
        <div className="leaderboard-table__inner" style={{ gridTemplateColumns }}>
          <div className="leaderboard-table__row leaderboard-table__row--head">
            <div className="leaderboard-table__cell">Место</div>
            <div className="leaderboard-table__cell leaderboard-table__cell--user">Пользователь</div>
            {columns.map((column) => (
              <div className="leaderboard-table__cell" key={column.key}>{column.label}</div>
            ))}
            {canResetRatings && <div className="leaderboard-table__cell">Действие</div>}
          </div>

          {entries.map((entry) => {
            const displayName = entry.name || entry.login;
            const isCurrentUser = Number(entry.id) === Number(currentUserId);

            return (
              <Link
                className={getRowClass({ rank: entry.rank, isCurrentUser })}
                key={entry.id}
                to={ROUTES.profileByUserId.replace(':userId', entry.id)}
              >
                <div
                  className={`leaderboard-table__cell leaderboard-table__rank ${getRankClass(entry.rank)}`}
                  ref={isCurrentUser ? ref : null}
                >
                  {entry.rank}
                </div>
                <div className="leaderboard-table__cell leaderboard-table__cell--user">
                  <span className="leaderboard-table__avatar">
                    {entry.avatar ? <img src={entry.avatar} alt={`Аватар ${displayName}`} /> : <AvatarIcon />}
                  </span>
                  <span className="leaderboard-table__name" title={displayName}>{displayName}</span>
                </div>
                {columns.map((column) => (
                  <div className="leaderboard-table__cell" key={column.key}>
                    {formatMetric(entry.metrics[column.key], column.type)}
                  </div>
                ))}
                {canResetRatings && (
                  <div className="leaderboard-table__cell">
                    <button
                      className="leaderboard-table__reset-button"
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onResetRating(entry);
                      }}
                    >
                      Обнулить
                    </button>
                  </div>
                )}
              </Link>
            );
          })}

          {currentUserEntry && (
            <>
              <div className="leaderboard-table__separator" style={{ gridColumn: `1 / ${columns.length + (canResetRatings ? 4 : 3)}` }}>
                •••
              </div>
              <Link
                className={getRowClass({ rank: currentUserEntry.rank, isCurrentUser: true })}
                to={ROUTES.profileByUserId.replace(':userId', currentUserEntry.id)}
              >
                <div
                  className={`leaderboard-table__cell leaderboard-table__rank ${getRankClass(currentUserEntry.rank)}`}
                  ref={ref}
                >
                  {currentUserEntry.rank}
                </div>
                <div className="leaderboard-table__cell leaderboard-table__cell--user">
                  <span className="leaderboard-table__avatar">
                    {currentUserEntry.avatar ? <img src={currentUserEntry.avatar} alt={`Аватар ${currentUserEntry.name || `@${currentUserEntry.login}`}`} /> : <AvatarIcon />}
                  </span>
                  <span className="leaderboard-table__name" title={currentUserEntry.name || `@${currentUserEntry.login}`}>
                    {currentUserEntry.name || `@${currentUserEntry.login}`}
                  </span>
                </div>
                {columns.map((column) => (
                  <div className="leaderboard-table__cell" key={column.key}>
                    {formatMetric(currentUserEntry.metrics[column.key], column.type)}
                  </div>
                ))}
                {canResetRatings && (
                  <div className="leaderboard-table__cell">
                    <button
                      className="leaderboard-table__reset-button"
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onResetRating(currentUserEntry);
                      }}
                    >
                      Обнулить
                    </button>
                  </div>
                )}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

LeaderboardTable.displayName = 'LeaderboardTable';

export default LeaderboardTable;

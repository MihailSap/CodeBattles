import { forwardRef, memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LEADERBOARD_METRIC_COLUMNS } from '@/entities/leaderboard';
import { ROUTES } from '@/shared/config/routes';
import { AvatarIcon } from '@/shared/ui/icons';
import leaderboardTableStyles from './LeaderboardTable.module.scss';

const formatMetric = (value: LegacyValue, type: LegacyValue) => {
  if (type === 'percent') {
    return `${Math.round(Number(value) || 0)}%`;
  }

  if (type === 'integer') {
    return String(Math.round(Number(value) || 0));
  }

  return Number(value || 0).toFixed(2);
};

const getRankClass = (rank: LegacyValue) => {
  if (rank === 1) {
    return leaderboardTableStyles.rankGold;
  }

  if (rank === 2) {
    return leaderboardTableStyles.rankSilver;
  }

  if (rank === 3) {
    return leaderboardTableStyles.rankBronze;
  }

  return '';
};

const getRowClass = ({ rank, isCurrentUser }: LegacyValue) => {
  const classes = [leaderboardTableStyles.row];

  if (rank === 1) {
    classes.push(leaderboardTableStyles.isGold);
  }

  if (rank === 2) {
    classes.push(leaderboardTableStyles.isSilver);
  }

  if (rank === 3) {
    classes.push(leaderboardTableStyles.isBronze);
  }

  if (isCurrentUser) {
    classes.push(leaderboardTableStyles.isCurrent);
  }

  return classes.join(' ');
};

const LeaderboardTable = forwardRef(
  (
    { entries, currentUserEntry, category, currentUserId, canResetRatings, onResetRating }: LegacyValue,
    ref: LegacyValue
  ) => {
    const columns = LEADERBOARD_METRIC_COLUMNS[category];

    const tableRows = useMemo(
      () => (currentUserEntry ? [...entries, currentUserEntry] : entries),
      [currentUserEntry, entries]
    );

    const gridTemplateColumns = useMemo(
      () =>
        `max-content minmax(max-content, 1fr) repeat(${columns.length}, max-content)${canResetRatings ? ' max-content' : ''}`,
      [canResetRatings, columns.length]
    );

    if (!tableRows.length) {
      return (
        <div className={[leaderboardTableStyles.root, leaderboardTableStyles.isEmpty].join(' ')}>
          Пользователи не найдены
        </div>
      );
    }

    return (
      <div className={leaderboardTableStyles.root}>
        <div className={leaderboardTableStyles.scroll}>
          <div
            className={leaderboardTableStyles.inner}
            style={{
              gridTemplateColumns,
            }}
          >
            <div className={[leaderboardTableStyles.row, leaderboardTableStyles.isHead].join(' ')}>
              <div className={leaderboardTableStyles.cell}>Место</div>
              <div className={[leaderboardTableStyles.cell, leaderboardTableStyles.isUser].join(' ')}>Пользователь</div>
              {columns.map((column: LegacyValue) => (
                <div className={leaderboardTableStyles.cell} key={column.key}>
                  {column.label}
                </div>
              ))}
              {canResetRatings && <div className={leaderboardTableStyles.cell}>Действие</div>}
            </div>

            {entries.map((entry: LegacyValue) => {
              const displayName = entry.name || entry.login;
              const isCurrentUser = Number(entry.id) === Number(currentUserId);

              return (
                <Link
                  className={getRowClass({
                    rank: entry.rank,
                    isCurrentUser,
                  })}
                  key={entry.id}
                  to={ROUTES.profileByUserId.replace(':userId', entry.id)}
                >
                  <div
                    className={[leaderboardTableStyles.cell, leaderboardTableStyles.rank, getRankClass(entry.rank)]
                      .filter(Boolean)
                      .join(' ')}
                    ref={isCurrentUser ? ref : null}
                  >
                    {entry.rank}
                  </div>
                  <div className={[leaderboardTableStyles.cell, leaderboardTableStyles.isUser].join(' ')}>
                    <span className={leaderboardTableStyles.avatar}>
                      {entry.avatar ? <img src={entry.avatar} alt={`Аватар ${displayName}`} /> : <AvatarIcon />}
                    </span>
                    <span className={leaderboardTableStyles.name} title={displayName}>
                      {displayName}
                    </span>
                  </div>
                  {columns.map((column: LegacyValue) => (
                    <div className={leaderboardTableStyles.cell} key={column.key}>
                      {formatMetric(entry.metrics[column.key], column.type)}
                    </div>
                  ))}
                  {canResetRatings && (
                    <div className={leaderboardTableStyles.cell}>
                      <button
                        className={leaderboardTableStyles.resetButton}
                        type="button"
                        onClick={(event: LegacyValue) => {
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
                <div
                  className={leaderboardTableStyles.separator}
                  style={{
                    gridColumn: `1 / ${columns.length + (canResetRatings ? 4 : 3)}`,
                  }}
                >
                  •••
                </div>
                <Link
                  className={getRowClass({
                    rank: currentUserEntry.rank,
                    isCurrentUser: true,
                  })}
                  to={ROUTES.profileByUserId.replace(':userId', currentUserEntry.id)}
                >
                  <div
                    className={[
                      leaderboardTableStyles.cell,
                      leaderboardTableStyles.rank,
                      getRankClass(currentUserEntry.rank),
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    ref={ref}
                  >
                    {currentUserEntry.rank}
                  </div>
                  <div className={[leaderboardTableStyles.cell, leaderboardTableStyles.isUser].join(' ')}>
                    <span className={leaderboardTableStyles.avatar}>
                      {currentUserEntry.avatar ? (
                        <img
                          src={currentUserEntry.avatar}
                          alt={`Аватар ${currentUserEntry.name || `@${currentUserEntry.login}`}`}
                        />
                      ) : (
                        <AvatarIcon />
                      )}
                    </span>
                    <span
                      className={leaderboardTableStyles.name}
                      title={currentUserEntry.name || `@${currentUserEntry.login}`}
                    >
                      {currentUserEntry.name || `@${currentUserEntry.login}`}
                    </span>
                  </div>
                  {columns.map((column: LegacyValue) => (
                    <div className={leaderboardTableStyles.cell} key={column.key}>
                      {formatMetric(currentUserEntry.metrics[column.key], column.type)}
                    </div>
                  ))}
                  {canResetRatings && (
                    <div className={leaderboardTableStyles.cell}>
                      <button
                        className={leaderboardTableStyles.resetButton}
                        type="button"
                        onClick={(event: LegacyValue) => {
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
  }
);

LeaderboardTable.displayName = 'LeaderboardTable';
export default memo(LeaderboardTable);

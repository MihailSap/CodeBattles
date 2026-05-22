import { LEADERBOARD_PERIOD, LEADERBOARD_SCOPE, LEADERBOARD_SORT_METRIC } from '../model';
import { MOCK_LEADERBOARD_ORGANIZATIONS, MOCK_LEADERBOARD_PROJECTS, MOCK_LEADERBOARD_USERS } from '@/entities/project';

const DEFAULT_CURRENT_USER_ID = 57;
const resetRatingUserIds = new Set();
const clone = (value: LegacyValue) => JSON.parse(JSON.stringify(value));

const wait = (data: LegacyValue, delay: LegacyValue = 350) =>
  new Promise((resolve: LegacyValue) => {
    window.setTimeout(() => resolve(clone(data)), delay);
  });

const normalizeQuery = (value: LegacyValue = '') => value.trim().toLowerCase();
const getViewerId = (viewerId: LegacyValue) => Number(viewerId || DEFAULT_CURRENT_USER_ID);

const getPeriodStats = (user: LegacyValue, period: LegacyValue) => {
  const stats = user.stats?.[period] || user.stats?.[LEADERBOARD_PERIOD.ALL_TIME];

  if (!resetRatingUserIds.has(user.id)) {
    return stats;
  }

  return Object.keys(stats).reduce((accumulator: LegacyValue, key: LegacyValue) => {
    accumulator[key] = 0;

    return accumulator;
  }, {});
};

const mapLeaderboardEntry = (user: LegacyValue, rank: LegacyValue, period: LegacyValue) => ({
  id: user.id,
  rank,
  name: user.name,
  login: user.login,
  avatar: user.avatar,
  metrics: getPeriodStats(user, period),
});

const filterUsersByScope = ({ scope, entityId }: LegacyValue) => {
  if (scope === LEADERBOARD_SCOPE.ORGANIZATIONS) {
    return MOCK_LEADERBOARD_USERS.filter((user: LegacyValue) => user.organizationIds.includes(Number(entityId)));
  }

  if (scope === LEADERBOARD_SCOPE.PROJECTS) {
    return MOCK_LEADERBOARD_USERS.filter((user: LegacyValue) => user.projectIds.includes(Number(entityId)));
  }

  return MOCK_LEADERBOARD_USERS;
};

const makeLeaderboard = ({ scope, entityId, period, category, query, viewerId, page, size }: LegacyValue) => {
  const normalizedQuery = normalizeQuery(query);
  const sortMetric = LEADERBOARD_SORT_METRIC[category];

  const scopedUsers = filterUsersByScope({
    scope,
    entityId,
  });

  const sortedUsers = [...scopedUsers].sort((left: LegacyValue, right: LegacyValue) => {
    const rightValue = getPeriodStats(right, period)?.[sortMetric] ?? 0;
    const leftValue = getPeriodStats(left, period)?.[sortMetric] ?? 0;

    if (rightValue === leftValue) {
      return left.id - right.id;
    }

    return rightValue - leftValue;
  });

  const rankedEntries = sortedUsers.map((user: LegacyValue, index: LegacyValue) =>
    mapLeaderboardEntry(user, index + 1, period)
  );

  const filteredEntries = rankedEntries.filter((entry: LegacyValue) => {
    if (!normalizedQuery) {
      return true;
    }

    return `${entry.name} ${entry.login}`.toLowerCase().includes(normalizedQuery);
  });

  const start = page * size;
  const content = filteredEntries.slice(start, start + size);
  const currentUserId = getViewerId(viewerId);
  const currentEntry = rankedEntries.find((entry: LegacyValue) => entry.id === currentUserId) || null;
  const currentUserInContent = content.some((entry: LegacyValue) => entry.id === currentUserId);

  return {
    content,
    currentUserEntry: currentEntry && !currentUserInContent ? currentEntry : null,
    page,
    size,
    totalElements: filteredEntries.length,
    totalPages: Math.ceil(filteredEntries.length / size),
  };
};

const getAvailableEntities = ({ type, viewerId, query, limit, isAdmin }: LegacyValue) => {
  const currentUserId = getViewerId(viewerId);
  const currentUser = MOCK_LEADERBOARD_USERS.find((user: LegacyValue) => user.id === currentUserId);
  const entityIds = type === LEADERBOARD_SCOPE.ORGANIZATIONS ? currentUser?.organizationIds : currentUser?.projectIds;

  const entities =
    type === LEADERBOARD_SCOPE.ORGANIZATIONS ? MOCK_LEADERBOARD_ORGANIZATIONS : MOCK_LEADERBOARD_PROJECTS;

  const normalizedQuery = normalizeQuery(query);

  if (!isAdmin && !entityIds?.length) {
    return [];
  }

  const allowedEntityIds = entityIds || [];

  return entities
    .filter((entity: LegacyValue) => isAdmin || allowedEntityIds.includes(entity.id))
    .filter((entity: LegacyValue) => !normalizedQuery || entity.name.toLowerCase().includes(normalizedQuery))
    .sort(
      (left: LegacyValue, right: LegacyValue) =>
        new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime()
    )
    .slice(0, limit);
};

export const leaderboardApi: LegacyValue = {
  async getLeaderboard({
    scope = LEADERBOARD_SCOPE.GLOBAL,
    entityId = null,
    period = LEADERBOARD_PERIOD.ALL_TIME,
    category,
    query = '',
    viewerId,
    page = 0,
    size = 100,
  }: LegacyValue) {
    return wait(
      makeLeaderboard({
        scope,
        entityId,
        period,
        category,
        query,
        viewerId,
        page,
        size,
      })
    );
  },
  async searchOrganizations({ viewerId, query = '', limit = 5, isAdmin = false }: LegacyValue = {}) {
    return wait(
      getAvailableEntities({
        type: LEADERBOARD_SCOPE.ORGANIZATIONS,
        viewerId,
        query,
        limit,
        isAdmin,
      }),
      250
    );
  },
  async searchProjects({ viewerId, query = '', limit = 5, isAdmin = false }: LegacyValue = {}) {
    return wait(
      getAvailableEntities({
        type: LEADERBOARD_SCOPE.PROJECTS,
        viewerId,
        query,
        limit,
        isAdmin,
      }),
      250
    );
  },
  async resetUserRating(userId: LegacyValue) {
    resetRatingUserIds.add(Number(userId));

    return wait(
      {
        userId: Number(userId),
        ratingReset: true,
      },
      250
    );
  },
};

import {
  LEADERBOARD_CATEGORY,
  LEADERBOARD_PERIOD,
  LEADERBOARD_SCOPE,
  LEADERBOARD_SORT_METRIC,
  type LeaderboardCategory,
  type LeaderboardMetricKey,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from '../model';
import {
  MOCK_LEADERBOARD_ORGANIZATIONS,
  MOCK_LEADERBOARD_PROJECTS,
  MOCK_LEADERBOARD_USERS,
  type LeaderboardEntity,
  type LeaderboardMetrics,
  type LeaderboardMockUser,
} from './mocks/leaderboard';
export type { LeaderboardEntity } from './mocks/leaderboard';

const DEFAULT_CURRENT_USER_ID = 57;
const resetRatingUserIds = new Set<number>();

export interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  login: string;
  avatar?: string;
  metrics: LeaderboardMetrics;
}

export interface LeaderboardParams {
  scope?: LeaderboardScope;
  entityId?: number | null;
  period?: LeaderboardPeriod;
  category: LeaderboardCategory;
  query?: string;
  viewerId?: number | string;
  page?: number;
  size?: number;
}

export interface LeaderboardResult {
  content: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface EntitySearchParams {
  viewerId?: number | string;
  query?: string;
  limit?: number;
  isAdmin?: boolean;
}

export interface ResetRatingResult {
  userId: number;
  ratingReset: boolean;
}

const clone = <T>(value: T): T => structuredClone(value);

const wait = <T>(data: T, delay = 350): Promise<T> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(data)), delay);
  });

const normalizeQuery = (value = ''): string => value.trim().toLowerCase();
const getViewerId = (viewerId?: number | string): number => Number(viewerId ?? DEFAULT_CURRENT_USER_ID);

const emptyMetrics = (): LeaderboardMetrics => ({
  totalRating: 0,
  codeQuality: 0,
  aiCodeQuality: 0,
  fixedCommentsPercent: 0,
  aiReviewQuality: 0,
  likesCount: 0,
  reviewDepthPercent: 0,
  completedReviewsCount: 0,
  completedTasksCount: 0,
});

const getPeriodStats = (user: LeaderboardMockUser, period: LeaderboardPeriod): LeaderboardMetrics =>
  resetRatingUserIds.has(user.id) ? emptyMetrics() : user.stats[period];

const mapLeaderboardEntry = (user: LeaderboardMockUser, rank: number, period: LeaderboardPeriod): LeaderboardEntry => ({
  id: user.id,
  rank,
  name: user.name,
  login: user.login,
  ...(user.avatar !== undefined ? { avatar: user.avatar } : {}),
  metrics: getPeriodStats(user, period),
});

const filterUsersByScope = (scope: LeaderboardScope, entityId: number | null): LeaderboardMockUser[] => {
  if (scope === LEADERBOARD_SCOPE.ORGANIZATIONS) {
    return MOCK_LEADERBOARD_USERS.filter((user) => user.organizationIds.includes(Number(entityId)));
  }

  if (scope === LEADERBOARD_SCOPE.PROJECTS) {
    return MOCK_LEADERBOARD_USERS.filter((user) => user.projectIds.includes(Number(entityId)));
  }

  return MOCK_LEADERBOARD_USERS;
};

const makeLeaderboard = ({
  scope = LEADERBOARD_SCOPE.GLOBAL,
  entityId = null,
  period = LEADERBOARD_PERIOD.ALL_TIME,
  category = LEADERBOARD_CATEGORY.OVERALL,
  query = '',
  viewerId,
  page = 0,
  size = 100,
}: LeaderboardParams): LeaderboardResult => {
  const normalizedQuery = normalizeQuery(query);
  const sortMetric: LeaderboardMetricKey = LEADERBOARD_SORT_METRIC[category];

  const sortedUsers = [...filterUsersByScope(scope, entityId)].sort((left, right) => {
    const rightValue = getPeriodStats(right, period)[sortMetric];
    const leftValue = getPeriodStats(left, period)[sortMetric];

    return rightValue === leftValue ? left.id - right.id : rightValue - leftValue;
  });

  const rankedEntries = sortedUsers.map((user, index) => mapLeaderboardEntry(user, index + 1, period));

  const filteredEntries = rankedEntries.filter(
    (entry) => !normalizedQuery || `${entry.name} ${entry.login}`.toLowerCase().includes(normalizedQuery)
  );

  const start = page * size;
  const content = filteredEntries.slice(start, start + size);
  const currentUserId = getViewerId(viewerId);
  const currentEntry = rankedEntries.find((entry) => entry.id === currentUserId) ?? null;
  const currentUserInContent = content.some((entry) => entry.id === currentUserId);

  return {
    content,
    currentUserEntry: currentEntry && !currentUserInContent ? currentEntry : null,
    page,
    size,
    totalElements: filteredEntries.length,
    totalPages: Math.ceil(filteredEntries.length / size),
  };
};

const getAvailableEntities = (
  type: typeof LEADERBOARD_SCOPE.ORGANIZATIONS | typeof LEADERBOARD_SCOPE.PROJECTS,
  { viewerId, query = '', limit = 5, isAdmin = false }: EntitySearchParams
): LeaderboardEntity[] => {
  const currentUser = MOCK_LEADERBOARD_USERS.find((user) => user.id === getViewerId(viewerId));
  const entityIds = type === LEADERBOARD_SCOPE.ORGANIZATIONS ? currentUser?.organizationIds : currentUser?.projectIds;

  const entities =
    type === LEADERBOARD_SCOPE.ORGANIZATIONS ? MOCK_LEADERBOARD_ORGANIZATIONS : MOCK_LEADERBOARD_PROJECTS;

  const normalizedQuery = normalizeQuery(query);

  if (!isAdmin && !entityIds?.length) {
    return [];
  }

  const allowedEntityIds = entityIds ?? [];

  return entities
    .filter((entity) => isAdmin || allowedEntityIds.includes(entity.id))
    .filter((entity) => !normalizedQuery || entity.name.toLowerCase().includes(normalizedQuery))
    .sort((left, right) => new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime())
    .slice(0, limit);
};

export const leaderboardApi = {
  async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardResult> {
    return wait(makeLeaderboard(params));
  },

  async searchOrganizations(params: EntitySearchParams = {}): Promise<LeaderboardEntity[]> {
    return wait(getAvailableEntities(LEADERBOARD_SCOPE.ORGANIZATIONS, params), 250);
  },

  async searchProjects(params: EntitySearchParams = {}): Promise<LeaderboardEntity[]> {
    return wait(getAvailableEntities(LEADERBOARD_SCOPE.PROJECTS, params), 250);
  },

  async resetUserRating(userId: number | string): Promise<ResetRatingResult> {
    resetRatingUserIds.add(Number(userId));

    return wait({ userId: Number(userId), ratingReset: true }, 250);
  },
};

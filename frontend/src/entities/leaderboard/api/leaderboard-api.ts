import { httpClient } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import {
  LEADERBOARD_SCOPE,
  type LeaderboardCategory,
  type LeaderboardPeriod,
  type LeaderboardScope,
} from '../model';

export interface LeaderboardMetrics {
  totalRating: number;
  codeQuality: number;
  aiCodeQuality: number | null;
  fixedCommentsPercent: number;
  aiReviewQuality: number | null;
  likesCount: number;
  reviewDepthPercent: number;
  completedReviewsCount: number;
  completedTasksCount: number;
}

export interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  login: string;
  avatar?: string;
  metrics: LeaderboardMetrics;
}

interface LeaderboardEntryDto {
  id: number;
  rank: number;
  name: string | null;
  login: string | null;
  avatar: string | null;
  metrics: LeaderboardMetrics;
}

export interface LeaderboardParams {
  scope?: LeaderboardScope;
  entityId?: number | null;
  period?: LeaderboardPeriod;
  category: LeaderboardCategory;
  query?: string;
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

interface LeaderboardPageDto {
  content: LeaderboardEntryDto[];
  currentUserEntry: LeaderboardEntryDto | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface LeaderboardEntity {
  id: number;
  name: string;
  lastActivityAt: string | null;
}

export interface EntitySearchParams {
  query?: string;
  limit?: number;
}

export interface ResetRatingResult {
  userId: number;
  ratingReset: boolean;
  resetAt: string;
}

const mapLeaderboardEntry = (entry: LeaderboardEntryDto): LeaderboardEntry => {
  const avatarUrl = getImageUrl(entry.avatar ?? undefined);

  return {
    id: entry.id,
    rank: entry.rank,
    name: entry.name ?? '',
    login: entry.login ?? '',
    ...(avatarUrl ? { avatar: avatarUrl } : {}),
    metrics: entry.metrics,
  };
};

const mapLeaderboardPage = (page: LeaderboardPageDto): LeaderboardResult => ({
  content: page.content.map(mapLeaderboardEntry),
  currentUserEntry: page.currentUserEntry ? mapLeaderboardEntry(page.currentUserEntry) : null,
  page: page.page,
  size: page.size,
  totalElements: page.totalElements,
  totalPages: page.totalPages,
});

const getLeaderboardUrl = (params: LeaderboardParams): string => {
  if (params.scope === LEADERBOARD_SCOPE.ORGANIZATIONS && params.entityId) {
    return `/api/v1/leaderboard/organizations/${params.entityId}`;
  }

  if (params.scope === LEADERBOARD_SCOPE.PROJECTS && params.entityId) {
    return `/api/v1/leaderboard/projects/${params.entityId}`;
  }

  return '/api/v1/leaderboard';
};

export const leaderboardApi = {
  async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardResult> {
    const response = await httpClient.get<LeaderboardPageDto>(getLeaderboardUrl(params), {
      params: {
        period: params.period,
        category: params.category,
        query: params.query || undefined,
        page: params.page ?? 0,
        size: params.size ?? 100,
      },
    });

    return mapLeaderboardPage(response.data);
  },

  async searchOrganizations(params: EntitySearchParams = {}): Promise<LeaderboardEntity[]> {
    const response = await httpClient.get<LeaderboardEntity[]>('/api/v1/leaderboard/organizations', {
      params: {
        query: params.query || undefined,
        limit: params.limit ?? 5,
      },
    });

    return response.data;
  },

  async searchProjects(params: EntitySearchParams = {}): Promise<LeaderboardEntity[]> {
    const response = await httpClient.get<LeaderboardEntity[]>('/api/v1/leaderboard/projects', {
      params: {
        query: params.query || undefined,
        limit: params.limit ?? 5,
      },
    });

    return response.data;
  },

  async resetUserRating(userId: number | string): Promise<ResetRatingResult> {
    const numericId = Number(userId);

    const response = await httpClient.post<ResetRatingResult>(`/api/v1/leaderboard/users/${numericId}/reset-rating`, {
      reason: 'Обнуление рейтинга администратором',
    });

    return response.data;
  },
};

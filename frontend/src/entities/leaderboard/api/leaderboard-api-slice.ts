import { baseApi, toQueryResult } from '@/shared/api';

import {
  leaderboardApi,
  type EntitySearchParams,
  type LeaderboardEntity,
  type LeaderboardParams,
  type LeaderboardResult,
  type ResetRatingResult,
} from './leaderboard-api';

export const leaderboardApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLeaderboard: build.query<LeaderboardResult, LeaderboardParams>({
      queryFn: (params) => toQueryResult(() => leaderboardApi.getLeaderboard(params)),
      providesTags: [{ type: 'Leaderboard', id: 'CURRENT' }],
    }),
    searchLeaderboardOrganizations: build.query<LeaderboardEntity[], EntitySearchParams>({
      queryFn: (params) => toQueryResult(() => leaderboardApi.searchOrganizations(params)),
      providesTags: [{ type: 'Leaderboard', id: 'ORGANIZATIONS' }],
    }),
    searchLeaderboardProjects: build.query<LeaderboardEntity[], EntitySearchParams>({
      queryFn: (params) => toQueryResult(() => leaderboardApi.searchProjects(params)),
      providesTags: [{ type: 'Leaderboard', id: 'PROJECTS' }],
    }),
    resetUserRating: build.mutation<ResetRatingResult, number | string>({
      queryFn: (userId) => toQueryResult(() => leaderboardApi.resetUserRating(userId)),
      invalidatesTags: [{ type: 'Leaderboard', id: 'CURRENT' }],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useResetUserRatingMutation,
  useSearchLeaderboardOrganizationsQuery,
  useSearchLeaderboardProjectsQuery,
} = leaderboardApiSlice;

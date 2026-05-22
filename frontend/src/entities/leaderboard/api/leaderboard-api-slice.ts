import { baseApi, toQueryResult } from '@/shared/api';
import { leaderboardApi } from './leaderboard-api';

export const leaderboardApiSlice = baseApi.injectEndpoints({
  endpoints: (build: LegacyValue) => ({
    getLeaderboard: build.query({
      queryFn: (params: LegacyValue) => toQueryResult(() => leaderboardApi.getLeaderboard(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'CURRENT',
        },
      ],
    }),
    searchLeaderboardOrganizations: build.query({
      queryFn: (params: LegacyValue) => toQueryResult(() => leaderboardApi.searchOrganizations(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'ORGANIZATIONS',
        },
      ],
    }),
    searchLeaderboardProjects: build.query({
      queryFn: (params: LegacyValue) => toQueryResult(() => leaderboardApi.searchProjects(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'PROJECTS',
        },
      ],
    }),
    resetUserRating: build.mutation({
      queryFn: (userId: LegacyValue) => toQueryResult(() => leaderboardApi.resetUserRating(userId)),
      invalidatesTags: [
        {
          type: 'Leaderboard',
          id: 'CURRENT',
        },
      ],
    }),
  }),
});
export const {
  useGetLeaderboardQuery,
  useResetUserRatingMutation,
  useSearchLeaderboardOrganizationsQuery,
  useSearchLeaderboardProjectsQuery,
} = leaderboardApiSlice;

import { baseApi, toQueryResult } from '@/shared/api';
import { leaderboardApi } from './leaderboard-api';
export const leaderboardApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLeaderboard: build.query({
      queryFn: (params) => toQueryResult(() => leaderboardApi.getLeaderboard(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'CURRENT',
        },
      ],
    }),
    searchLeaderboardOrganizations: build.query({
      queryFn: (params) => toQueryResult(() => leaderboardApi.searchOrganizations(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'ORGANIZATIONS',
        },
      ],
    }),
    searchLeaderboardProjects: build.query({
      queryFn: (params) => toQueryResult(() => leaderboardApi.searchProjects(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'PROJECTS',
        },
      ],
    }),
    resetUserRating: build.mutation({
      queryFn: (userId) => toQueryResult(() => leaderboardApi.resetUserRating(userId)),
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

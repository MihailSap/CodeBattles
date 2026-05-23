import { baseApi, toQueryResult } from '@/shared/api';
import { leaderboardApi } from './leaderboard-api';

export const leaderboardApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLeaderboard: build.query<LegacyValue, LegacyValue>({
      queryFn: (params: LegacyValue) => toQueryResult(() => leaderboardApi.getLeaderboard(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'CURRENT',
        },
      ],
    }),
    searchLeaderboardOrganizations: build.query<LegacyValue, LegacyValue>({
      queryFn: (params: LegacyValue) => toQueryResult(() => leaderboardApi.searchOrganizations(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'ORGANIZATIONS',
        },
      ],
    }),
    searchLeaderboardProjects: build.query<LegacyValue, LegacyValue>({
      queryFn: (params: LegacyValue) => toQueryResult(() => leaderboardApi.searchProjects(params)),
      providesTags: [
        {
          type: 'Leaderboard',
          id: 'PROJECTS',
        },
      ],
    }),
    resetUserRating: build.mutation<LegacyValue, LegacyValue>({
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

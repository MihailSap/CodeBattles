import { baseApi, toQueryResult } from '@/shared/api';
import { profileApi } from './profile-api';

export const profileApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfilePageData: build.query({
      queryFn: (userId = 'me') => toQueryResult(() => profileApi.getProfilePageData(userId)),
      providesTags: (_result, _error, userId = 'me') => [{ type: 'Profile', id: userId }],
    }),
    updateProfileSection: build.mutation({
      queryFn: (payload) => toQueryResult(() => profileApi.updateProfileSection(payload)),
      invalidatesTags: [
        { type: 'Profile', id: 'me' },
        { type: 'CurrentUser', id: 'ME' },
      ],
    }),
    updateSkillsSection: build.mutation({
      queryFn: ({ userId, skills }) => toQueryResult(() => profileApi.updateSkillsSection(userId, skills)),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Profile', id: userId },
        { type: 'Profile', id: 'me' },
      ],
    }),
    deleteAvatar: build.mutation({
      queryFn: () => toQueryResult(() => profileApi.deleteAvatar()),
      invalidatesTags: [
        { type: 'Profile', id: 'me' },
        { type: 'CurrentUser', id: 'ME' },
      ],
    }),
  }),
});

export const {
  useDeleteAvatarMutation,
  useGetProfilePageDataQuery,
  useUpdateProfileSectionMutation,
  useUpdateSkillsSectionMutation,
} = profileApiSlice;

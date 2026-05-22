import { baseApi, toQueryResult } from '@/shared/api';
import { profileApi } from './profile-api';

export const profileApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfilePageData: build.query<LegacyValue, LegacyValue>({
      queryFn: (userId: LegacyValue = 'me') => toQueryResult(() => profileApi.getProfilePageData(userId)),
      providesTags: (_result: LegacyValue, _error: LegacyValue, userId: LegacyValue = 'me') => [
        {
          type: 'Profile',
          id: userId,
        },
      ],
    }),
    updateProfileSection: build.mutation<LegacyValue, LegacyValue>({
      queryFn: (payload: LegacyValue) => toQueryResult(() => profileApi.updateProfileSection(payload)),
      invalidatesTags: [
        {
          type: 'Profile',
          id: 'me',
        },
        {
          type: 'CurrentUser',
          id: 'ME',
        },
      ],
    }),
    updateSkillsSection: build.mutation<LegacyValue, LegacyValue>({
      queryFn: ({ userId, skills }: LegacyValue) => toQueryResult(() => profileApi.updateSkillsSection(userId, skills)),
      invalidatesTags: (_result: LegacyValue, _error: LegacyValue, { userId }: LegacyValue) => [
        {
          type: 'Profile',
          id: userId,
        },
        {
          type: 'Profile',
          id: 'me',
        },
      ],
    }),
    deleteAvatar: build.mutation<LegacyValue, LegacyValue>({
      queryFn: () => toQueryResult(() => profileApi.deleteAvatar()),
      invalidatesTags: [
        {
          type: 'Profile',
          id: 'me',
        },
        {
          type: 'CurrentUser',
          id: 'ME',
        },
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

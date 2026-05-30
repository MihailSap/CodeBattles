import { baseApi, toQueryResult } from '@/shared/api';

import type {
  AvatarResult,
  ProfileIdentifier,
  ProfilePageData,
  ProfileSectionPayload,
  ProfileSkills,
  UpdateSkillsArg,
} from '../model/types';
import { profileApi } from './profile-api';

export const profileApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProfilePageData: build.query<ProfilePageData, ProfileIdentifier | void>({
      queryFn: (userId) => toQueryResult(() => profileApi.getProfilePageData(userId ?? 'me')),
      providesTags: (_result, _error, userId) => [{ type: 'Profile', id: userId ?? 'me' }],
    }),
    updateProfileSection: build.mutation<ProfilePageData['user'], ProfileSectionPayload>({
      queryFn: (payload) => toQueryResult(() => profileApi.updateProfileSection(payload)),
      invalidatesTags: [
        { type: 'Profile', id: 'me' },
        { type: 'CurrentUser', id: 'ME' },
      ],
    }),
    updateSkillsSection: build.mutation<ProfileSkills, UpdateSkillsArg>({
      queryFn: ({ userId, skills }) => toQueryResult(() => profileApi.updateSkillsSection(userId, skills)),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Profile', id: userId },
        { type: 'Profile', id: 'me' },
      ],
    }),
    deleteAvatar: build.mutation<AvatarResult, void>({
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

import { baseApi, toQueryResult } from '@/shared/api';
import { userApi } from './user-api';

export const userApiSlice = baseApi.injectEndpoints({
  endpoints: (build: LegacyValue) => ({
    getUsers: build.query({
      queryFn: (params: LegacyValue = {}) => toQueryResult(() => userApi.getAll(params)),
      providesTags: (result: LegacyValue) => {
        const users = result?.content || [];

        return [
          {
            type: 'Users',
            id: 'LIST',
          },
          ...users.map((user: LegacyValue) => ({
            type: 'Users',
            id: user.id,
          })),
        ];
      },
    }),
    deleteUser: build.mutation({
      queryFn: (userId: LegacyValue) => toQueryResult(() => userApi.delete(userId)),
      invalidatesTags: [
        {
          type: 'Users',
          id: 'LIST',
        },
      ],
    }),
    makeAdmin: build.mutation({
      queryFn: (userId: LegacyValue) => toQueryResult(() => userApi.makeAdmin(userId)),
      invalidatesTags: (_result: LegacyValue, _error: LegacyValue, userId: LegacyValue) => [
        {
          type: 'Users',
          id: userId,
        },
        {
          type: 'Users',
          id: 'LIST',
        },
      ],
    }),
    makeNotAdmin: build.mutation({
      queryFn: (userId: LegacyValue) => toQueryResult(() => userApi.makeNotAdmin(userId)),
      invalidatesTags: (_result: LegacyValue, _error: LegacyValue, userId: LegacyValue) => [
        {
          type: 'Users',
          id: userId,
        },
        {
          type: 'Users',
          id: 'LIST',
        },
      ],
    }),
    enableUser: build.mutation({
      queryFn: (userId: LegacyValue) => toQueryResult(() => userApi.enableUser(userId)),
      invalidatesTags: (_result: LegacyValue, _error: LegacyValue, userId: LegacyValue) => [
        {
          type: 'Users',
          id: userId,
        },
        {
          type: 'Users',
          id: 'LIST',
        },
      ],
    }),
  }),
});
export const {
  useDeleteUserMutation,
  useEnableUserMutation,
  useGetUsersQuery,
  useMakeAdminMutation,
  useMakeNotAdminMutation,
} = userApiSlice;

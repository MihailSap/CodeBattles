import { baseApi, toQueryResult } from '@/shared/api';
import { userApi } from './user-api';
export const userApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query({
      queryFn: (params = {}) => toQueryResult(() => userApi.getAll(params)),
      providesTags: (result) => {
        const users = result?.content || [];

        return [
          {
            type: 'Users',
            id: 'LIST',
          },
          ...users.map((user) => ({
            type: 'Users',
            id: user.id,
          })),
        ];
      },
    }),
    deleteUser: build.mutation({
      queryFn: (userId) => toQueryResult(() => userApi.delete(userId)),
      invalidatesTags: [
        {
          type: 'Users',
          id: 'LIST',
        },
      ],
    }),
    makeAdmin: build.mutation({
      queryFn: (userId) => toQueryResult(() => userApi.makeAdmin(userId)),
      invalidatesTags: (_result, _error, userId) => [
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
      queryFn: (userId) => toQueryResult(() => userApi.makeNotAdmin(userId)),
      invalidatesTags: (_result, _error, userId) => [
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
      queryFn: (userId) => toQueryResult(() => userApi.enableUser(userId)),
      invalidatesTags: (_result, _error, userId) => [
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

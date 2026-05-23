import { baseApi, toQueryResult } from '@/shared/api';
import { userApi } from './user-api';

import type { User } from '../model/types';
import type { PaginationParams, PaginatedResponse } from '@/shared/api';

export const userApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<PaginatedResponse<User>, PaginationParams>({
      queryFn: (params = {}) => toQueryResult(() => userApi.getAll(params)),
      providesTags: (result) => {
        const users = result?.content || [];

        return [
          {
            type: 'Users' as const,
            id: 'LIST',
          },
          ...users.map((user) => ({
            type: 'Users' as const,
            id: user.id,
          })),
        ];
      },
    }),
    deleteUser: build.mutation<void, number | string>({
      queryFn: (userId) => toQueryResult(() => userApi.delete(userId)),
      invalidatesTags: [
        {
          type: 'Users' as const,
          id: 'LIST',
        },
      ],
    }),
    makeAdmin: build.mutation<void, number | string>({
      queryFn: (userId) => toQueryResult(() => userApi.makeAdmin(userId)),
      invalidatesTags: (_result, _error, userId) => [
        {
          type: 'Users' as const,
          id: userId,
        },
        {
          type: 'Users' as const,
          id: 'LIST',
        },
      ],
    }),
    makeNotAdmin: build.mutation<void, number | string>({
      queryFn: (userId) => toQueryResult(() => userApi.makeNotAdmin(userId)),
      invalidatesTags: (_result, _error, userId) => [
        {
          type: 'Users' as const,
          id: userId,
        },
        {
          type: 'Users' as const,
          id: 'LIST',
        },
      ],
    }),
    enableUser: build.mutation<void, number | string>({
      queryFn: (userId) => toQueryResult(() => userApi.enableUser(userId)),
      invalidatesTags: (_result, _error, userId) => [
        {
          type: 'Users' as const,
          id: userId,
        },
        {
          type: 'Users' as const,
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

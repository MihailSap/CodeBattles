import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const getQueryError = (error) => ({
  status: error?.status || error?.response?.status || 'CUSTOM_ERROR',
  data: error?.response?.data || error?.message || error,
  code: error?.code
});

export const toQueryResult = async (request) => {
  try {
    return { data: await request() };
  } catch (error) {
    return { error: getQueryError(error) };
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  keepUnusedDataFor: 120,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 60,
  tagTypes: [
    'CurrentUser',
    'Dashboard',
    'Project',
    'Task',
    'Organization',
    'Review',
    'Profile',
    'Users',
    'Leaderboard'
  ],
  endpoints: () => ({})
});

import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const getQueryError = (error: LegacyValue) => ({
  status: error?.status || error?.response?.status || 'CUSTOM_ERROR',
  data: error?.response?.data || error?.message || error,
  code: error?.code,
});

export const toQueryResult = async (request: LegacyValue) => {
  try {
    return {
      data: await request(),
    };
  } catch (error: LegacyValue) {
    return {
      error: getQueryError(error),
    };
  }
};

export const baseApi: LegacyValue = createApi({
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
    'Leaderboard',
    'Notification',
    'AdminComplaint',
    'AdminEvent',
    'AdminSettings',
  ],
  endpoints: () => ({}),
});

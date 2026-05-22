import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { DomainError } from './types';

interface QueryErrorLike {
  message?: string;
  code?: string;
  status?: number;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

const toQueryErrorLike = (value: unknown): QueryErrorLike =>
  typeof value === 'object' && value !== null ? (value as QueryErrorLike) : {};

export const getQueryError = (error: unknown): DomainError => {
  const errorLike = toQueryErrorLike(error);

  return {
    name: 'DomainError',
    message: errorLike.response?.data?.message ?? errorLike.message ?? 'Request failed',
    status: errorLike.status ?? errorLike.response?.status ?? 500,
    raw: errorLike.response?.data ?? errorLike.message ?? error,
    ...(errorLike.code ? { code: errorLike.code } : {}),
  };
};

export const toQueryResult = async <T>(request: () => Promise<T>) => {
  try {
    return {
      data: await request(),
    };
  } catch (error: unknown) {
    return {
      error: getQueryError(error),
    };
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
    'Leaderboard',
    'Notification',
    'AdminComplaint',
    'AdminEvent',
    'AdminSettings',
  ],
  endpoints: () => ({}),
});

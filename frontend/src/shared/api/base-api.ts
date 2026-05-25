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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const toQueryErrorLike = (value: unknown): QueryErrorLike => {
  if (!isRecord(value)) {
    return {};
  }

  const responseData =
    isRecord(value['response']) && isRecord(value['response']['data']) ? value['response']['data'] : undefined;

  const responseStatus = isRecord(value['response']) ? value['response']['status'] : undefined;

  return {
    ...(typeof value['message'] === 'string' ? { message: value['message'] } : {}),
    ...(typeof value['code'] === 'string' ? { code: value['code'] } : {}),
    ...(typeof value['status'] === 'number' ? { status: value['status'] } : {}),
    ...(typeof responseStatus === 'number' || (responseData && typeof responseData['message'] === 'string')
      ? {
          response: {
            ...(typeof responseStatus === 'number' ? { status: responseStatus } : {}),
            ...(responseData && typeof responseData['message'] === 'string'
              ? { data: { message: responseData['message'] } }
              : {}),
          },
        }
      : {}),
  };
};

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

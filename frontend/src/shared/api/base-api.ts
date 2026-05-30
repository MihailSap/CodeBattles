import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { DomainError } from './types';

const DEFAULT_ERROR_MESSAGE = 'Request failed';
const DEFAULT_ERROR_STATUS = 500;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getFiniteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const getString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const getResponseData = (error: unknown): unknown => {
  if (!isRecord(error) || !isRecord(error['response'])) {
    return undefined;
  }

  return error['response']['data'];
};

const getResponseStatus = (error: unknown): number | undefined => {
  if (!isRecord(error) || !isRecord(error['response'])) {
    return undefined;
  }

  return getFiniteNumber(error['response']['status']);
};

const getPayloadMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const message = payload['message'];

  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message) && message.every((item): item is string => typeof item === 'string')) {
    return message.join(', ');
  }

  return undefined;
};

const getPayloadCode = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  return getString(payload['code']) ?? getString(payload['status']);
};

const getRawValue = (error: unknown): unknown => {
  if (isRecord(error) && 'raw' in error) {
    return error['raw'];
  }

  return error;
};

export const getQueryError = (error: unknown): DomainError => {
  const responseData = getResponseData(error) ?? getResponseData(getRawValue(error));

  const message =
    getPayloadMessage(responseData) ??
    (isRecord(error) ? getString(error['message']) : undefined) ??
    (typeof error === 'string' ? error : DEFAULT_ERROR_MESSAGE);

  const status =
    getResponseStatus(error) ??
    (isRecord(error) ? getFiniteNumber(error['status']) : undefined) ??
    DEFAULT_ERROR_STATUS;

  const code = (isRecord(error) ? getString(error['code']) : undefined) ?? getPayloadCode(responseData);

  return {
    name: 'DomainError',
    message,
    status,
    raw: responseData ?? message,
    ...(code ? { code } : {}),
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
  baseQuery: fakeBaseQuery<DomainError>(),
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

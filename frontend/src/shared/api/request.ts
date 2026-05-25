import type { AxiosRequestConfig } from 'axios';

import { httpClient } from './http-client';
import type { DomainError } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getBackendMessage = (error: unknown): string | undefined => {
  if (!isRecord(error) || !isRecord(error['response']) || !isRecord(error['response']['data'])) {
    return undefined;
  }

  return typeof error['response']['data']['message'] === 'string' ? error['response']['data']['message'] : undefined;
};

const getResponseStatus = (error: unknown): number | undefined => {
  if (!isRecord(error) || !isRecord(error['response'])) {
    return undefined;
  }

  return typeof error['response']['status'] === 'number' ? error['response']['status'] : undefined;
};

const parseBackendMessage = (message: string | undefined): { status: number; code: string } | undefined => {
  const match = message?.trim().match(/^(\d{3})\s+([A-Z0-9_\-']+)/);

  if (!match) {
    return undefined;
  }

  const status = match[1];
  const code = match[2];

  return status && code ? { status: Number(status), code } : undefined;
};

export const toDomainError = (error: unknown): DomainError => {
  const backendMessage = getBackendMessage(error);
  const parsed = parseBackendMessage(backendMessage);
  const message = backendMessage ?? (error instanceof Error ? error.message : 'Request failed');
  const nextError: DomainError = new Error(message);

  nextError.status = parsed?.status ?? getResponseStatus(error) ?? 500;
  const code = parsed?.code ?? backendMessage;

  if (code) {
    nextError.code = code;
  }

  nextError.raw = error;

  return nextError;
};

export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await httpClient<T>(config);

    return response.data;
  } catch (error: unknown) {
    throw toDomainError(error);
  }
};

export const toBackendLocalDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (number: number): string => String(number).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

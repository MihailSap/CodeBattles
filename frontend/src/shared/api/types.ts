import type { InternalAxiosRequestConfig } from 'axios';

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface DomainError extends Error {
  status?: number;
  code?: string;
  raw?: unknown;
}

export interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  pageSize?: number;
  search?: string;
  filter?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  content?: T[];
  total: number;
  totalItems?: number;
  totalElements?: number;
  page: number;
  size: number;
  pageSize?: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

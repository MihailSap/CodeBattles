import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '@/shared/config/api';
import { tokenStorage } from '@/shared/lib';
import type { CustomInternalAxiosRequestConfig } from './types';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});

let refreshRequestPromise: Promise<string> | null = null;

const requestNewAccessToken = async (): Promise<string> => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh token is missing');
  }

  const accessResponse = await refreshClient.post('/api/v1/auth/token', {
    refreshToken,
  });

  const nextAccessToken = accessResponse.data?.accessToken;

  if (!nextAccessToken) {
    throw new Error('Access token was not returned by backend');
  }

  try {
    const refreshResponse = await refreshClient.post(
      '/api/v1/auth/refresh',
      {
        refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${nextAccessToken}`,
        },
      }
    );

    tokenStorage.setTokens({
      accessToken: refreshResponse.data?.accessToken || nextAccessToken,
      refreshToken: refreshResponse.data?.refreshToken || refreshToken,
    });
  } catch {
    tokenStorage.setTokens({
      accessToken: nextAccessToken,
      refreshToken,
    });
  }

  return tokenStorage.getAccessToken() ?? '';
};

const getFreshAccessToken = async (): Promise<string> => {
  if (!refreshRequestPromise) {
    refreshRequestPromise = requestNewAccessToken().finally(() => {
      refreshRequestPromise = null;
    });
  }

  return refreshRequestPromise;
};

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as CustomInternalAxiosRequestConfig | undefined;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const status = axiosError.response?.status;
    const shouldRefreshByStatus = status === 401;

    if (!shouldRefreshByStatus) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const freshAccessToken = await getFreshAccessToken();

      if (!freshAccessToken) {
        throw new Error('Failed to refresh access token');
      }

      originalRequest.headers = originalRequest.headers ?? axios.AxiosHeaders.from({});

      originalRequest.headers.Authorization = `Bearer ${freshAccessToken}`;

      return httpClient(originalRequest);
    } catch (refreshError: unknown) {
      tokenStorage.clearTokens();

      return Promise.reject(refreshError);
    }
  }
);

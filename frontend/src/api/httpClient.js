import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { authApi } from './authApi';
import { tokenStorage } from '../utils/tokenStorage';

export const httpClient = axios.create({
  baseURL: API_BASE_URL
});

let refreshRequestPromise = null;

const requestNewAccessToken = async () => {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error('Refresh token is missing');
  }

  const accessResponse = await authApi.getNewAccessToken(refreshToken);
  const nextAccessToken = accessResponse.data?.accessToken;

  if (!nextAccessToken) {
    throw new Error('Access token was not returned by backend');
  }

  try {
    const refreshResponse = await authApi.getNewRefreshToken(refreshToken, nextAccessToken);

    tokenStorage.setTokens({
      accessToken: refreshResponse.data?.accessToken || nextAccessToken,
      refreshToken: refreshResponse.data?.refreshToken || refreshToken
    });
  } catch {
    tokenStorage.setTokens({ accessToken: nextAccessToken, refreshToken });
  }

  return tokenStorage.getAccessToken();
};

const getFreshAccessToken = async () => {
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
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // const shouldRefreshByStatus = status === 401;
    const shouldRefreshByStatus = status === 403;

    if (!shouldRefreshByStatus) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const freshAccessToken = await getFreshAccessToken();

      if (!freshAccessToken) {
        throw new Error('Failed to refresh access token');
      }

      originalRequest.headers.Authorization = `Bearer ${freshAccessToken}`;

      return httpClient(originalRequest);
    } catch (refreshError) {
      tokenStorage.clearTokens();

      return Promise.reject(refreshError);
    }
  }
);

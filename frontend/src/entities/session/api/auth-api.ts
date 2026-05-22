import axios from 'axios';
import { API_BASE_URL } from '@/shared/config/api';
import { tokenStorage } from '@/shared/lib';
import type { LoginPayload, RegisterPayload, ResetPasswordPayload } from '../model/types';
import type { AxiosResponse } from 'axios';
import type { TokensResponse } from '@/shared/api';

const authClient = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi = {
  register(payload: RegisterPayload) {
    return authClient.post('/api/v1/auth/register', payload);
  },
  login(payload: LoginPayload): Promise<AxiosResponse<TokensResponse>> {
    return authClient.post('/api/v1/auth/login', payload);
  },
  verifyEmail(token: string): Promise<AxiosResponse<TokensResponse>> {
    return authClient.post('/api/v1/auth/verify-email', null, {
      params: {
        token,
      },
    });
  },
  forgotPassword(email: string) {
    return authClient.post('/api/v1/auth/forgot-password', null, {
      params: {
        email,
      },
    });
  },
  resetPassword(payload: ResetPasswordPayload) {
    return authClient.patch('/api/v1/auth/reset-password', payload);
  },
  getNewAccessToken(refreshToken: string): Promise<AxiosResponse<Partial<TokensResponse>>> {
    return authClient.post('/api/v1/auth/token', {
      refreshToken,
    });
  },
  getNewRefreshToken(refreshToken: string, accessToken: string | null = tokenStorage.getAccessToken()): Promise<AxiosResponse<Partial<TokensResponse>>> {
    return authClient.post(
      '/api/v1/auth/refresh',
      {
        refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },
  logout(refreshToken: string, accessToken: string | null = tokenStorage.getAccessToken()) {
    return authClient.post(
      '/api/v1/auth/logout',
      {
        refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  },
};

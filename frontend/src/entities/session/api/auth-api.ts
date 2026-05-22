import axios from 'axios';
import { API_BASE_URL } from '@/shared/config/api';
import { tokenStorage } from '@/shared/lib';

const authClient = axios.create({
  baseURL: API_BASE_URL,
});

export const authApi: LegacyValue = {
  register(payload: LegacyValue) {
    return authClient.post('/api/v1/auth/register', payload);
  },
  login(payload: LegacyValue) {
    return authClient.post('/api/v1/auth/login', payload);
  },
  verifyEmail(token: LegacyValue) {
    return authClient.post('/api/v1/auth/verify-email', null, {
      params: {
        token,
      },
    });
  },
  forgotPassword(email: LegacyValue) {
    return authClient.post('/api/v1/auth/forgot-password', null, {
      params: {
        email,
      },
    });
  },
  resetPassword(payload: LegacyValue) {
    return authClient.patch('/api/v1/auth/reset-password', payload);
  },
  getNewAccessToken(refreshToken: LegacyValue) {
    return authClient.post('/api/v1/auth/token', {
      refreshToken,
    });
  },
  getNewRefreshToken(refreshToken: LegacyValue, accessToken: LegacyValue = tokenStorage.getAccessToken()) {
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
  logout(refreshToken: LegacyValue, accessToken: LegacyValue = tokenStorage.getAccessToken()) {
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

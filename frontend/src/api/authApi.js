import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { tokenStorage } from '../utils/tokenStorage';

const authClient = axios.create({
  baseURL: API_BASE_URL
});

export const authApi = {
  register(payload) {
    return authClient.post('/api/v1/auth/register', payload);
  },
  login(payload) {
    return authClient.post('/api/v1/auth/login', payload);
  },
  verifyEmail(token) {
    return authClient.post('/api/v1/auth/verify-email', null, {
      params: {
        token
      }
    });
  },
  forgotPassword(email) {
    return authClient.post('/api/v1/auth/forgot-password', null, {
      params: {
        email
      }
    });
  },
  resetPassword(payload) {
    return authClient.patch('/api/v1/auth/reset-password', payload);
  },
  getNewAccessToken(refreshToken) {
    return authClient.post('/api/v1/auth/token', { refreshToken });
  },
  getNewRefreshToken(refreshToken, accessToken = tokenStorage.getAccessToken()) {
    return authClient.post(
      '/api/v1/auth/refresh',
      { refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
  },
  logout(refreshToken, accessToken = tokenStorage.getAccessToken()) {
    return authClient.post(
      '/api/v1/auth/logout',
      { refreshToken },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
  }
};

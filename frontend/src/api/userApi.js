import { httpClient } from './httpClient';

export const userApi = {
  getCurrentUser() {
    return httpClient.get('/api/v1/auth/current-user');
  },
  updateLogin(userId, newLogin) {
    return httpClient.patch(`/api/v1/users/${userId}/login`, { newLogin });
  },
  updatePassword(userId, newPassword) {
    return httpClient.patch(`/api/v1/users/${userId}/password`, { newPassword });
  }
};

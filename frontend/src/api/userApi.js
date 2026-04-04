import { httpClient } from './httpClient';

export const userApi = {
  getAll({ page = 0, size = 10, filter } = {}) {
    const params = { page, size };

    if (filter) {
      params.filter = filter;
    }

    return httpClient.get('/api/v1/users', { params });
  },
  getById(userId) {
    return httpClient.get(`/api/v1/users/${userId}`);
  },
  delete(userId) {
    return httpClient.delete(`/api/v1/users/${userId}`);
  },
  getCurrentUser() {
    return httpClient.get('/api/v1/auth/current-user');
  },
  makeAdmin(userId) {
    return httpClient.patch(`/api/v1/users/${userId}/admin`);
  },
  makeNotAdmin(userId) {
    return httpClient.patch(`/api/v1/users/${userId}/not-admin`);
  },
  updateLogin(userId, newLogin) {
    return httpClient.patch(`/api/v1/users/${userId}/login`, { newLogin });
  },
  updatePassword(userId, newPassword) {
    return httpClient.patch(`/api/v1/users/${userId}/password`, { newPassword });
  }
};

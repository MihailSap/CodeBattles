import { httpClient } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

const mapUser = (user) => {
  if (!user) return null;
  const fileName = user.avatarPath || user.avatar || user.avatarFileTitle;

  return {
    ...user,
    avatarPath: getImageUrl(fileName),
  };
};

export const userApi = {
  async getAll({ page = 0, size = 10, filter } = {}) {
    const params = {
      page,
      size,
    };

    if (filter) {
      params.filter = filter;
    }

    const response = await httpClient.get('/api/v1/users', {
      params,
    });

    return {
      ...response.data,
      content: (response.data.content || []).map(mapUser),
    };
  },
  async getById(userId) {
    const response = await httpClient.get(`/api/v1/users/${userId}`);

    return mapUser(response.data);
  },
  delete(userId) {
    return httpClient.delete(`/api/v1/users/${userId}`);
  },
  async getCurrentUser() {
    const response = await httpClient.get('/api/v1/auth/current-user');

    return mapUser(response.data);
  },
  makeAdmin(userId) {
    return httpClient.patch(`/api/v1/users/${userId}/admin`);
  },
  makeNotAdmin(userId) {
    return httpClient.patch(`/api/v1/users/${userId}/not-admin`);
  },
  updateLogin(userId, newLogin) {
    return httpClient.patch(`/api/v1/users/${userId}/login`, {
      newLogin,
    });
  },
  updatePassword(userId, newPassword) {
    return httpClient.patch(`/api/v1/users/${userId}/password`, {
      newPassword,
    });
  },
  enableUser(userId) {
    return httpClient.patch(`/api/v1/users/${userId}/enable`);
  },
};

import { httpClient } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

const mapUser = (user: LegacyValue) => {
  if (!user) return null;
  const fileName = user.avatarPath || user.avatar || user.avatarFileTitle;

  return {
    ...user,
    avatarPath: getImageUrl(fileName),
  };
};

export const userApi: LegacyValue = {
  async getAll({ page = 0, size = 10, filter }: LegacyValue = {}) {
    const params: LegacyValue = {
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
  async getById(userId: LegacyValue) {
    const response = await httpClient.get(`/api/v1/users/${userId}`);

    return mapUser(response.data);
  },
  delete(userId: LegacyValue) {
    return httpClient.delete(`/api/v1/users/${userId}`);
  },
  async getCurrentUser() {
    const response = await httpClient.get('/api/v1/auth/current-user');

    return mapUser(response.data);
  },
  makeAdmin(userId: LegacyValue) {
    return httpClient.patch(`/api/v1/users/${userId}/admin`);
  },
  makeNotAdmin(userId: LegacyValue) {
    return httpClient.patch(`/api/v1/users/${userId}/not-admin`);
  },
  updateLogin(userId: LegacyValue, newLogin: LegacyValue) {
    return httpClient.patch(`/api/v1/users/${userId}/login`, {
      newLogin,
    });
  },
  updatePassword(userId: LegacyValue, newPassword: LegacyValue) {
    return httpClient.patch(`/api/v1/users/${userId}/password`, {
      newPassword,
    });
  },
  enableUser(userId: LegacyValue) {
    return httpClient.patch(`/api/v1/users/${userId}/enable`);
  },
};

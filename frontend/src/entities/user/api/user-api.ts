import { httpClient } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import type { User } from '../model/types';
import type { PaginatedResponse, PaginationParams } from '@/shared/api';

type RawUser = Partial<User> & {
  avatar?: string;
  avatarPath?: string;
  avatarFileTitle?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const mapUser = (user: unknown): User | null => {
  if (!isRecord(user)) {
    return null;
  }

  const rawUser = user as RawUser;
  const fileName = rawUser.avatarPath || rawUser.avatar || rawUser.avatarFileTitle;

  return {
    ...(rawUser as User),
    avatarPath: getImageUrl(fileName),
  };
};

export const userApi = {
  async getAll({ page = 0, size = 10, search: filter }: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    const params: Record<string, unknown> = {
      page,
      size,
    };

    if (filter) {
      params.filter = filter;
    }

    const response = await httpClient.get('/api/v1/users', {
      params,
    });

    const content = Array.isArray(response.data?.content) ? response.data.content : [];

    return {
      ...response.data,
      content: content.map(mapUser).filter((user: User | null): user is User => user !== null),
    };
  },
  async getById(userId: number | string): Promise<User | null> {
    const response = await httpClient.get(`/api/v1/users/${userId}`);

    return mapUser(response.data);
  },
  async delete(userId: number | string): Promise<void> {
    await httpClient.delete(`/api/v1/users/${userId}`);
  },
  async getCurrentUser(): Promise<User | null> {
    const response = await httpClient.get('/api/v1/auth/current-user');

    return mapUser(response.data);
  },
  async makeAdmin(userId: number | string): Promise<void> {
    await httpClient.patch(`/api/v1/users/${userId}/admin`);
  },
  async makeNotAdmin(userId: number | string): Promise<void> {
    await httpClient.patch(`/api/v1/users/${userId}/not-admin`);
  },
  updateLogin(userId: number | string, newLogin: string) {
    return httpClient.patch(`/api/v1/users/${userId}/login`, {
      newLogin,
    });
  },
  updatePassword(userId: number | string, newPassword: string) {
    return httpClient.patch(`/api/v1/users/${userId}/password`, {
      newPassword,
    });
  },
  async enableUser(userId: number | string): Promise<void> {
    await httpClient.patch(`/api/v1/users/${userId}/enable`);
  },
};

import { httpClient } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import type { User } from '../model/types';
import type { PaginatedResponse, PaginationParams } from '@/shared/api';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const mapUser = (user: unknown): User | null => {
  if (!isRecord(user)) {
    return null;
  }

  if (typeof user['id'] !== 'number' || typeof user['login'] !== 'string') {
    return null;
  }

  const fileName =
    typeof user['avatarPath'] === 'string'
      ? user['avatarPath']
      : typeof user['avatar'] === 'string'
        ? user['avatar']
        : typeof user['avatarFileTitle'] === 'string'
          ? user['avatarFileTitle']
          : undefined;

  return {
    id: user['id'],
    login: user['login'],
    ...(typeof user['name'] === 'string' ? { name: user['name'] } : {}),
    ...(typeof user['fullName'] === 'string' ? { fullName: user['fullName'] } : {}),
    ...(typeof user['email'] === 'string' ? { email: user['email'] } : {}),
    ...(typeof user['avatar'] === 'string' ? { avatar: user['avatar'] } : {}),
    ...(typeof user['avatarFileTitle'] === 'string' ? { avatarFileTitle: user['avatarFileTitle'] } : {}),
    ...(typeof user['role'] === 'string' || user['role'] === null ? { role: user['role'] } : {}),
    ...(typeof user['registeredAt'] === 'string' ? { registeredAt: user['registeredAt'] } : {}),
    ...(typeof user['enabled'] === 'boolean' ? { enabled: user['enabled'] } : {}),
    avatarPath: getImageUrl(fileName),
  };
};

const mapUsers = (value: unknown): User[] =>
  Array.isArray(value) ? value.map(mapUser).filter((user): user is User => user !== null) : [];

const getNumber = (value: unknown, fallback: number): number => (typeof value === 'number' ? value : fallback);

export const userApi = {
  async getAll({ page = 0, size = 10, search: filter }: PaginationParams = {}): Promise<PaginatedResponse<User>> {
    const params: Record<string, unknown> = {
      page,
      size,
    };

    if (filter) {
      params['filter'] = filter;
    }

    const response = await httpClient.get<unknown>('/api/v1/users', {
      params,
    });

    const data = isRecord(response.data) ? response.data : {};
    const content = mapUsers(data['content']);
    const items = mapUsers(data['items']);
    const normalizedItems = items.length > 0 ? items : content;

    return {
      items: normalizedItems,
      content,
      total: getNumber(data['total'], getNumber(data['totalElements'], normalizedItems.length)),
      page: getNumber(data['page'], page),
      size: getNumber(data['size'], size),
      totalPages: getNumber(data['totalPages'], 0),
      ...(typeof data['totalItems'] === 'number' ? { totalItems: data['totalItems'] } : {}),
      ...(typeof data['totalElements'] === 'number' ? { totalElements: data['totalElements'] } : {}),
      ...(typeof data['pageSize'] === 'number' ? { pageSize: data['pageSize'] } : {}),
      ...(typeof data['hasNext'] === 'boolean' ? { hasNext: data['hasNext'] } : {}),
      ...(typeof data['hasPrevious'] === 'boolean' ? { hasPrevious: data['hasPrevious'] } : {}),
    };
  },
  async getById(userId: number | string): Promise<User | null> {
    const response = await httpClient.get<unknown>(`/api/v1/users/${userId}`);

    return mapUser(response.data);
  },
  async delete(userId: number | string): Promise<void> {
    await httpClient.delete(`/api/v1/users/${userId}`);
  },
  async getCurrentUser(): Promise<User | null> {
    const response = await httpClient.get<unknown>('/api/v1/auth/current-user');

    return mapUser(response.data);
  },
  async makeAdmin(userId: number | string): Promise<void> {
    await httpClient.patch(`/api/v1/users/${userId}/admin`);
  },
  async makeNotAdmin(userId: number | string): Promise<void> {
    await httpClient.patch(`/api/v1/users/${userId}/not-admin`);
  },
  async updateLogin(userId: number | string, newLogin: string): Promise<User | null> {
    const response = await httpClient.patch<unknown>(`/api/v1/users/${userId}/login`, {
      newLogin,
    });

    return mapUser(response.data);
  },
  async updatePassword(userId: number | string, newPassword: string): Promise<string> {
    const response = await httpClient.patch<unknown>(`/api/v1/users/${userId}/password`, {
      newPassword,
    });

    return typeof response.data === 'string' ? response.data : 'Пароль обновлен';
  },
  async enableUser(userId: number | string): Promise<void> {
    await httpClient.patch(`/api/v1/users/${userId}/enable`);
  },
};

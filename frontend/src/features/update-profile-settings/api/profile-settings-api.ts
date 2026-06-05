import { httpClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config/api';

export interface NotificationSettings {
  reviewAssignments: boolean;
  newComments: boolean;
  achievements: boolean;
}

export interface LinkedAccounts {
  githubLogin: string;
}

export type LinkedAccountProvider = 'github';

export interface LinkAccountStart {
  authorizationUrl: string;
}

interface PasswordUpdateResult {
  updated?: boolean;
}

export const profileSettingsApi = {
  async updatePassword(currentPassword: string, newPassword: string): Promise<PasswordUpdateResult> {
    const response = await httpClient.patch<PasswordUpdateResult>('/api/v1/profile/me/password', {
      currentPassword,
      newPassword,
    });

    return response.data;
  },
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await httpClient.get<NotificationSettings>('/api/v1/profile/me/notification-settings');

    return response.data;
  },
  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    const response = await httpClient.put<NotificationSettings>('/api/v1/profile/me/notification-settings', settings);

    return response.data;
  },
  async getLinkedAccounts(): Promise<LinkedAccounts> {
    const response = await httpClient.get<LinkedAccounts>('/api/v1/profile/me/linked-accounts');

    return response.data;
  },
  async linkAccount(provider: LinkedAccountProvider): Promise<LinkAccountStart> {
    const response = await httpClient.post<LinkAccountStart>(
      `/api/v1/profile/me/linked-accounts/${provider}`,
      undefined,
      { withCredentials: true }
    );

    const authorizationUrl = response.data.authorizationUrl;
    const url = new URL(API_BASE_URL.startsWith('http') ? API_BASE_URL : window.location.origin);
    const hostUrl = `${url.protocol}//${url.host}`;

    return {
      authorizationUrl: authorizationUrl.startsWith('http') ? authorizationUrl : `${hostUrl}${authorizationUrl}`,
    };
  },
  async unlinkAccount(provider: LinkedAccountProvider): Promise<LinkedAccounts> {
    const response = await httpClient.delete<LinkedAccounts>(`/api/v1/profile/me/linked-accounts/${provider}`);

    return response.data;
  },
};

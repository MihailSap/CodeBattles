import { httpClient } from '@/shared/api';

export interface NotificationSettings {
  reviewAssignments: boolean;
  newComments: boolean;
  achievements: boolean;
}

export interface LinkedAccounts {
  githubLogin: string;
  gitlabLogin: string;
}

export type LinkedAccountProvider = 'github' | 'gitlab';

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
  async linkAccount(provider: LinkedAccountProvider): Promise<LinkedAccounts> {
    console.warn(`Link account for ${provider} is not implemented on backend`);

    return this.getLinkedAccounts();
  },
  async unlinkAccount(provider: LinkedAccountProvider): Promise<LinkedAccounts> {
    console.warn(`Unlink account for ${provider} is not implemented on backend`);

    return this.getLinkedAccounts();
  },
};

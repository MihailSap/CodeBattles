import { httpClient } from './httpClient';

export const profileSettingsApi = {
  async updatePassword(currentPassword, newPassword) {
    const response = await httpClient.patch('/api/v1/profile/me/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  async getNotificationSettings() {
    const response = await httpClient.get('/api/v1/profile/me/notification-settings');
    return response.data;
  },

  async updateNotificationSettings(settings) {
    const response = await httpClient.put('/api/v1/profile/me/notification-settings', settings);
    return response.data;
  },

  async getLinkedAccounts() {
    const response = await httpClient.get('/api/v1/profile/me/linked-accounts');
    return response.data;
  },

  async linkAccount(provider) {
    console.warn(`Link account for ${provider} is not implemented on backend`);
    return this.getLinkedAccounts();
  },

  async unlinkAccount(provider) {
    console.warn(`Unlink account for ${provider} is not implemented on backend`);
    return this.getLinkedAccounts();
  }
};

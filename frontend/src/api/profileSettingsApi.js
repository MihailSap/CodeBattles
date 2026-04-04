import { userApi } from './userApi';

const defaultNotificationSettings = {
  reviewAssignments: true,
  newComments: true,
  achievements: true
};

const defaultLinkedAccounts = {
  githubLogin: '',
  gitlabLogin: ''
};

const state = {
  notificationsByUserId: {},
  linkedAccountsByUserId: {}
};

const getKey = (userId) => {
  if (userId === null || userId === undefined) {
    return 'guest';
  }

  return String(userId);
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export const profileSettingsApi = {
  async updatePassword(userId, newPassword) {
    if (userId === null || userId === undefined) {
      throw new Error('Не удалось определить ID пользователя');
    }

    const response = await userApi.updatePassword(userId, newPassword);
    return response.data;
  },

  async getNotificationSettings(userId) {
    const key = getKey(userId);
    const settings = state.notificationsByUserId[key] || defaultNotificationSettings;
    return clone(settings);
  },

  async updateNotificationSettings(userId, settings) {
    const key = getKey(userId);
    state.notificationsByUserId[key] = {
      ...defaultNotificationSettings,
      ...settings
    };
    return clone(state.notificationsByUserId[key]);
  },

  async getLinkedAccounts(userId) {
    const key = getKey(userId);
    const accounts = state.linkedAccountsByUserId[key] || defaultLinkedAccounts;
    return clone(accounts);
  },

  async linkAccount(userId, provider) {
    const key = getKey(userId);
    const current = state.linkedAccountsByUserId[key] || defaultLinkedAccounts;

    if (provider === 'github') {
      state.linkedAccountsByUserId[key] = {
        ...current,
        githubLogin: current.githubLogin || ''
      };
    }

    if (provider === 'gitlab') {
      state.linkedAccountsByUserId[key] = {
        ...current,
        gitlabLogin: current.gitlabLogin || ''
      };
    }

    return clone(state.linkedAccountsByUserId[key]);
  },

  async unlinkAccount(userId, provider) {
    const key = getKey(userId);
    const current = state.linkedAccountsByUserId[key] || defaultLinkedAccounts;

    if (provider === 'github') {
      state.linkedAccountsByUserId[key] = {
        ...current,
        githubLogin: ''
      };
    }

    if (provider === 'gitlab') {
      state.linkedAccountsByUserId[key] = {
        ...current,
        gitlabLogin: ''
      };
    }

    return clone(state.linkedAccountsByUserId[key]);
  }
};

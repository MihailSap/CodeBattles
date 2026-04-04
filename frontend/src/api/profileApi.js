import { ACHIEVEMENTS, MOCK_RECEIVED_ACHIEVEMENT_IDS } from '../constants/achievements';
import { MOCK_USER_SKILLS } from '../constants/profileSkills';

const withDelay = (value, ms = 600) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

const clone = (value) => JSON.parse(JSON.stringify(value));

const mockState = {
  user: {
    name: '',
    registeredAt: '2025-12-10T11:35:00.000Z',
    avatarPath: ''
  },
  skills: clone(MOCK_USER_SKILLS),
  statistics: {
    qualityScore: 4,
    aiQualityScore: 5,
    usefulnessIndex: 4,
    reviewDepth: 3,
    acceptedDecisionsPercent: 81
  },
  receivedAchievementIds: [...MOCK_RECEIVED_ACHIEVEMENT_IDS],
  achievements: clone(ACHIEVEMENTS)
};

export const profileApi = {
  async getProfilePageData() {
    return withDelay(clone(mockState));
  },
  async updateProfileSection(payload) {
    mockState.user = {
      ...mockState.user,
      name: payload.name,
      avatarPath: payload.avatarPath
    };

    return withDelay(clone(mockState.user));
  },
  async updateSkillsSection(skills) {
    mockState.skills = clone(skills);

    return withDelay(clone(mockState.skills));
  },
  async uploadAvatar(file) {
    if (!file) {
      return withDelay({ avatarPath: '' });
    }

    const avatarPath = URL.createObjectURL(file);

    return withDelay({ avatarPath });
  },
  async deleteAvatar() {
    return withDelay({ avatarPath: '' });
  }
};

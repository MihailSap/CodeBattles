import { ACHIEVEMENTS, MOCK_RECEIVED_ACHIEVEMENT_IDS } from '../constants/achievements';
import { httpClient } from './httpClient';
import { getImageUrl } from '../utils/imageUrl';

export const profileApi = {
  async getProfilePageData(userId = 'me') {
    const url = userId === 'me' ? '/api/v1/profile/me' : `/api/v1/profile/${userId}`;
    const response = await httpClient.get(url);
    const user = response.data;

    console.log('Fetched user data:', user);

    const skills = {
      languages: Array.isArray(user.languages) ? user.languages : [],
      frameworks: Array.isArray(user.frameworks) ? user.frameworks : [],
      tools: Array.isArray(user.tools) ? user.tools : []
    };

    const fallbackStatistics = {
      qualityScore: 4,
      aiQualityScore: 5,
      usefulnessIndex: 4,
      reviewDepth: 3,
      acceptedDecisionsPercent: 81
    };

    return {
      user: {
        ...user,
        avatarPath: getImageUrl(user.avatarPath || user.avatar || user.avatarFileTitle)
      },
      skills,
      statistics: {
        qualityScore: user.qualityScore || fallbackStatistics.qualityScore,
        aiQualityScore: user.aiQualityScore || fallbackStatistics.aiQualityScore,
        usefulnessIndex: user.usefulnessIndex || fallbackStatistics.usefulnessIndex,
        reviewDepth: user.reviewDepth || fallbackStatistics.reviewDepth,
        acceptedDecisionsPercent: user.acceptedDecisionsPercent || fallbackStatistics.acceptedDecisionsPercent
      },
      receivedAchievementIds: Array.isArray(user.receivedAchievementIds) && user.receivedAchievementIds.length > 0
        ? user.receivedAchievementIds
        : MOCK_RECEIVED_ACHIEVEMENT_IDS,
      achievements: Array.isArray(user.achievements) && user.achievements.length > 0
        ? user.achievements
        : ACHIEVEMENTS
    };
  },

  async updateProfileSection(payload) {
    const formData = new FormData();
    formData.append('name', payload.name);

    const avatarFile = payload.avatar || payload.avatarFile;
    if (avatarFile instanceof File) {
      formData.append('avatar', avatarFile);
    }

    const response = await httpClient.patch('/api/v1/profile/me', formData);
    const user = response.data;

    return {
      ...user,
      avatarPath: getImageUrl(user.avatarPath || user.avatar || user.avatarFileTitle)
    };
  },

  async updateSkillsSection(userId, skills) {
    if (!userId) return skills;

    const stackRequests = [
      ...(skills.languages || []).map(name => ({ title: name, type: 'LANGUAGES' })),
      ...(skills.frameworks || []).map(name => ({ title: name, type: 'FRAMEWORKS' })),
      ...(skills.tools || []).map(name => ({ title: name, type: 'TOOLS' }))
    ];

    await httpClient.patch(`/api/v1/users/stack/${userId}`, stackRequests);
    return skills;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpClient.post('/api/v1/profile/me/avatar', formData);
    return {
      avatarPath: getImageUrl(response.data.avatarPath)
    };
  },

  async deleteAvatar() {
    await httpClient.delete('/api/v1/profile/me/avatar');
    return { avatarPath: '' };
  }
};

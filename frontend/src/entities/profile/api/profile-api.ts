import { resolveAchievementImage, type Achievement } from '@/entities/achievement/@x/profile';
import { httpClient } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import type {
  AvatarResult,
  ProfileIdentifier,
  ProfilePageData,
  ProfileSectionPayload,
  ProfileSkills,
} from '../model/types';

interface ProfileDto {
  id: number;
  login: string;
  name?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  avatarPath?: string;
  avatarFileTitle?: string;
  role?: string | null;
  registeredAt?: string;
  enabled?: boolean;
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  qualityScore?: number;
  aiQualityScore?: number | null;
  usefulnessIndex?: number | null;
  reviewDepth?: number;
  acceptedDecisionsPercent?: number;
  receivedAchievementIds?: number[];
  achievements?: Achievement[];
}

interface StackRequest {
  title: string;
  type: 'LANGUAGES' | 'FRAMEWORKS' | 'TOOLS';
}

const mapProfileUser = (user: ProfileDto): ProfilePageData['user'] => ({
  id: user.id,
  login: user.login,
  name: user.name ?? user.fullName ?? '',
  ...(user.fullName !== undefined ? { fullName: user.fullName } : {}),
  ...(user.email !== undefined ? { email: user.email } : {}),
  ...(user.role !== undefined ? { role: user.role } : {}),
  ...(user.registeredAt !== undefined ? { registeredAt: user.registeredAt } : {}),
  ...(user.enabled !== undefined ? { enabled: user.enabled } : {}),
  avatarPath: getImageUrl(user.avatarPath ?? user.avatar ?? user.avatarFileTitle),
});

const mapAchievement = (achievement: Achievement): Achievement => ({
  ...achievement,
  image: resolveAchievementImage(achievement.image),
});

export const profileApi = {
  async getProfilePageData(userId: ProfileIdentifier = 'me'): Promise<ProfilePageData> {
    const url = userId === 'me' ? '/api/v1/profile/me' : `/api/v1/profile/${userId}`;
    const response = await httpClient.get<ProfileDto>(url);
    const user = response.data;

    return {
      user: mapProfileUser(user),
      skills: {
        languages: user.languages ?? [],
        frameworks: user.frameworks ?? [],
        tools: user.tools ?? [],
      },
      statistics: {
        qualityScore: user.qualityScore ?? 0,
        aiQualityScore: user.aiQualityScore ?? 0,
        usefulnessIndex: user.usefulnessIndex ?? 0,
        reviewDepth: user.reviewDepth ?? 0,
        acceptedDecisionsPercent: user.acceptedDecisionsPercent ?? 0,
      },
      receivedAchievementIds: user.receivedAchievementIds ?? [],
      achievements: user.achievements?.map(mapAchievement) ?? [],
    };
  },

  async updateProfileSection(payload: ProfileSectionPayload): Promise<ProfilePageData['user']> {
    const formData = new FormData();

    if (payload.name !== undefined) {
      formData.append('name', payload.name);
    }

    const avatarFile = payload.avatar instanceof File ? payload.avatar : payload.avatarFile;

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const response = await httpClient.patch<ProfileDto>('/api/v1/profile/me', formData);

    return mapProfileUser(response.data);
  },

  async updateSkillsSection(userId: ProfileIdentifier, skills: ProfileSkills): Promise<ProfileSkills> {
    if (!userId) {
      return skills;
    }

    const stackRequests: StackRequest[] = [
      ...skills.languages.map((title) => ({ title, type: 'LANGUAGES' as const })),
      ...skills.frameworks.map((title) => ({ title, type: 'FRAMEWORKS' as const })),
      ...skills.tools.map((title) => ({ title, type: 'TOOLS' as const })),
    ];

    await httpClient.patch(`/api/v1/users/stack/${userId}`, stackRequests);

    return skills;
  },

  async uploadAvatar(file: File): Promise<AvatarResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await httpClient.post<AvatarResult>('/api/v1/profile/me/avatar', formData);

    return { avatarPath: getImageUrl(response.data.avatarPath) };
  },

  async deleteAvatar(): Promise<AvatarResult> {
    await httpClient.delete('/api/v1/profile/me/avatar');

    return { avatarPath: '' };
  },
};

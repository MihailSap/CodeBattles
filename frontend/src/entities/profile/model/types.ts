import type { Achievement } from '@/entities/achievement/@x/profile';
import type { User } from '@/entities/user';

export type ProfileIdentifier = number | string | 'me';

export interface ProfileSkills {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

export interface ProfileStatistics {
  qualityScore: number;
  aiQualityScore: number | null;
  usefulnessIndex: number | null;
  reviewDepth: number;
  acceptedDecisionsPercent: number;
}

export interface ProfilePageData {
  user: User;
  skills: ProfileSkills;
  statistics: ProfileStatistics;
  receivedAchievementIds: number[];
  achievements: Achievement[];
}

export interface ProfileSectionPayload {
  name?: string;
  avatar?: File | string | null;
  avatarFile?: File | null;
}

export interface AvatarResult {
  avatarPath: string;
}

export interface UpdateSkillsArg {
  userId: ProfileIdentifier;
  skills: ProfileSkills;
}

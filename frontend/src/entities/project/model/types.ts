import type { User } from '@/entities/user';

export interface ProjectParticipant extends User {
  role: string;
}

export interface Task {
  id: number | string;
  projectId: number | string;
  projectName?: string;
  name: string;
  description?: string;
  requirements?: string;
  evaluationCriteria?: string;
  status: string;
  deadline?: string;
  reviewType?: string;
  assignees?: ProjectParticipant[];
  reviewers?: ProjectParticipant[];
  assigneeIds?: (number | string)[];
  reviewerIds?: (number | string)[];
  viewerRole?: string;
  commentsCount?: number;
  hasSolution?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isMock?: boolean;
  canManageSettings?: boolean;
  availableAssignees?: ProjectParticipant[];
  availableReviewers?: ProjectParticipant[];
  [key: string]: unknown;
}

export interface Project {
  id: number | string;
  name: string;
  description?: string;
  privacy: string;
  organizationId?: number | string;
  organizationName?: string;
  role?: string;
  participantsCount?: number;
  openTasksCount?: number;
  lastActivityAt?: string | null;
  viewerRole?: string;
  canSeeTasks?: boolean;
  participants?: ProjectParticipant[];
  tasks?: Task[];
  stack?: string[];
  aiReviewEnabled?: boolean;
  repositoryUrl?: string;
  [key: string]: unknown;
}

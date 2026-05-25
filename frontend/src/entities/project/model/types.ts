import type { User } from '@/entities/user';
import type { ProjectMemberRole, ProjectPrivacy, TaskReviewType, TaskStatus } from '../model';

export type EntityId = number | string;

export interface ProjectParticipant extends User {
  role: ProjectMemberRole;
}

export interface Task {
  id: EntityId;
  projectId: EntityId;
  organizationId?: EntityId | null;
  solutionId?: EntityId;
  projectName?: string;
  projectPrivacy?: ProjectPrivacy;
  aiReviewEnabled?: boolean;
  name: string;
  description?: string;
  requirements?: string;
  evaluationCriteria?: string;
  status: TaskStatus;
  deadline?: string;
  reviewType?: TaskReviewType;
  assignees?: ProjectParticipant[];
  reviewers?: ProjectParticipant[];
  assigneeIds?: EntityId[];
  reviewerIds?: EntityId[];
  viewerRole?: ProjectMemberRole;
  commentsCount?: number;
  hasSolution?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isMock?: boolean;
  canManageSettings?: boolean;
  canViewTask?: boolean;
  canUploadSolution?: boolean;
  canFinishReview?: boolean;
  availableAssignees?: ProjectParticipant[];
  availableReviewers?: ProjectParticipant[];
}

export interface Project {
  id: EntityId;
  name: string;
  description?: string;
  privacy: ProjectPrivacy;
  organizationId?: EntityId | null;
  organizationName?: string;
  role?: ProjectMemberRole;
  participantsCount?: number;
  openTasksCount?: number;
  lastActivityAt?: string | null;
  viewerRole?: ProjectMemberRole;
  canSeeTasks?: boolean;
  participants?: ProjectParticipant[];
  tasks?: Task[];
  stack?: string[];
  aiReviewEnabled?: boolean;
  repositoryUrl?: string;
}

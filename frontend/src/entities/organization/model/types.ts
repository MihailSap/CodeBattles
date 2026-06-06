import type { EntityId, Project, ProjectMemberRole, ProjectParticipant } from '@/entities/project/@x/organization';
import type { OrganizationMemberRole } from '../model';

export interface Organization {
  id: EntityId;
  name: string;
  logo?: string;
  link?: string;
  description?: string;
  role?: OrganizationMemberRole;
  participantsCount?: number;
  projectsCount?: number;
  projects?: Project[];
  hiddenProjectsCount?: number;
  hasPendingRequest?: boolean;
}

export interface OrganizationProject {
  id: EntityId;
  name: string;
  description: string;
  activeTasksCount: number;
  participants: ProjectParticipant[];
  participantsCount?: number;
  viewerRole: ProjectMemberRole;
}

export interface OrganizationJoinRequest {
  id: EntityId;
  userId: EntityId;
  login: string;
  fullName?: string;
  avatar?: string;
}

export interface OrganizationDetails {
  id: EntityId;
  name: string;
  description: string;
  link: string;
  logoUrl: string;
  ownerId: EntityId;
  viewerRole: OrganizationMemberRole;
  participants: ProjectParticipant[];
  projects: OrganizationProject[];
  joinRequests: OrganizationJoinRequest[];
}

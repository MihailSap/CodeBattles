import type { EntityId, ProjectMemberRole, ProjectParticipant } from '@/entities/project/@x/organization';
import { apiRequest, toBackendLocalDateTime } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import type { OrganizationCreateFormValues, OrganizationSettingsFormValues } from '../lib/validation';
import { ORGANIZATION_MEMBER_ROLE, type OrganizationMemberRole } from '../model';
import type { Organization, OrganizationDetails, OrganizationJoinRequest, OrganizationProject } from '../model/types';

export type UpdateOrganizationPayload = Partial<
  Pick<OrganizationSettingsFormValues, 'name' | 'link' | 'description' | 'logoFile'>
>;

const PROJECT_MEMBER_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const satisfies Record<string, ProjectMemberRole>;

interface BackendParticipantDto {
  id: number;
  login: string;
  email?: string;
  fullName?: string;
  avatar?: string | null;
  role?: ProjectMemberRole;
}

interface BackendProjectDto {
  id: EntityId;
  name: string;
  description?: string;
  organizationId?: EntityId;
  participantsCount?: number;
  openTasksCount?: number;
  activeTasksCount?: number;
  role?: ProjectMemberRole;
  viewerRole?: ProjectMemberRole;
  participants?: BackendParticipantDto[];
}

interface BackendOrganizationDto {
  id: EntityId;
  name: string;
  logo?: string | null;
  logoUrl?: string | null;
  link?: string;
  description?: string;
  participantsCount?: number;
  projectsCount?: number;
  isAdmin?: boolean;
  hasPendingRequest?: boolean;
  ownerId?: EntityId;
  viewerRole?: OrganizationMemberRole;
  participants?: BackendParticipantDto[];
  projects?: BackendProjectDto[];
  joinRequests?: BackendJoinRequestDto[];
}

interface BackendJoinRequestDto {
  id: EntityId;
  login: string;
  fullName?: string;
  avatar?: string | null;
}

interface StatusDto {
  isDeleted?: boolean;
  deleted?: boolean;
  isLeft?: boolean;
  left?: boolean;
}

export interface SearchParams {
  search?: string;
  query?: string;
}

export interface OrganizationProjectsResult {
  data: OrganizationProject[];
  total: number;
}

export interface OrganizationsResult {
  data: Organization[];
  total: number;
}

export interface OrganizationMutationResult {
  accepted?: boolean;
  organizationId?: EntityId;
}

export interface InvitePayload {
  expiresAt: string;
}

export interface OrganizationInviteResult {
  token: string;
  link: string;
}

const mapParticipant = (participant: BackendParticipantDto): ProjectParticipant => ({
  id: participant.id,
  login: participant.login,
  email: participant.email ?? '',
  fullName: participant.fullName ?? '',
  avatar: getImageUrl(participant.avatar),
  role: participant.role ?? PROJECT_MEMBER_ROLE.MEMBER,
});

const mapProjectListItem = (project: BackendProjectDto): OrganizationProject => ({
  id: project.id,
  name: project.name,
  description: project.description ?? '',
  activeTasksCount: project.activeTasksCount ?? project.openTasksCount ?? 0,
  participants: (project.participants ?? []).map(mapParticipant),
  participantsCount: project.participantsCount ?? 0,
  viewerRole: project.viewerRole ?? project.role ?? PROJECT_MEMBER_ROLE.GUEST,
});

const sortByName = <T extends { name: string }>(items: readonly T[]): T[] =>
  [...items].sort((left, right) => left.name.localeCompare(right.name));

const sortProjects = (projects: readonly OrganizationProject[]): OrganizationProject[] => {
  const roles: Record<ProjectMemberRole, number> = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2,
  };

  return [...projects].sort(
    (left, right) => roles[left.viewerRole] - roles[right.viewerRole] || left.name.localeCompare(right.name)
  );
};

const sortOrganizations = (organizations: readonly Organization[]): Organization[] =>
  [...organizations].sort((left, right) => {
    const roleDifference =
      Number(right.role === ORGANIZATION_MEMBER_ROLE.OWNER) - Number(left.role === ORGANIZATION_MEMBER_ROLE.OWNER);

    return roleDifference || left.name.localeCompare(right.name);
  });

const sortParticipants = (participants: readonly ProjectParticipant[]): ProjectParticipant[] => {
  const roles: Record<ProjectMemberRole, number> = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2,
  };

  return [...participants].sort(
    (left, right) =>
      roles[left.role] - roles[right.role] ||
      (left.fullName ?? '').localeCompare(right.fullName ?? '') ||
      left.login.localeCompare(right.login)
  );
};

const sortJoinRequests = (requests: readonly OrganizationJoinRequest[]): OrganizationJoinRequest[] =>
  [...requests].sort((left, right) => (left.fullName ?? left.login).localeCompare(right.fullName ?? right.login));

const mapOrganizationListItem = (organization: BackendOrganizationDto): Organization => ({
  id: organization.id,
  logo: getImageUrl(organization.logo),
  name: organization.name,
  link: organization.link ?? '',
  description: organization.description ?? '',
  participantsCount: organization.participantsCount ?? 0,
  projectsCount: organization.projectsCount ?? 0,
  role: organization.isAdmin ? ORGANIZATION_MEMBER_ROLE.OWNER : ORGANIZATION_MEMBER_ROLE.MEMBER,
  hasPendingRequest: Boolean(organization.hasPendingRequest),
});

const mapCreateOrganizationPayload = (payload: OrganizationCreateFormValues): FormData => {
  const formData = new FormData();
  formData.append('name', payload.name);

  if (payload.link) formData.append('link', payload.link);
  if (payload.description) formData.append('description', payload.description);
  formData.append('logo', payload.logoFile);

  return formData;
};

export const organizationApi = {
  async getOrganizationById(organizationId: EntityId): Promise<OrganizationDetails> {
    const organization = await apiRequest<BackendOrganizationDto>({
      method: 'GET',
      url: `/api/v1/organizations/${organizationId}`,
    });

    if (organization.ownerId === undefined) {
      throw new Error('Owner is missing in organization response');
    }

    return {
      id: organization.id,
      name: organization.name,
      description: organization.description ?? '',
      link: organization.link ?? '',
      logoUrl: getImageUrl(organization.logoUrl),
      ownerId: organization.ownerId,
      viewerRole: organization.viewerRole ?? ORGANIZATION_MEMBER_ROLE.MEMBER,
      participants: sortParticipants((organization.participants ?? []).map(mapParticipant)),
      projects: sortProjects((organization.projects ?? []).map(mapProjectListItem)),
      joinRequests: sortJoinRequests(
        (organization.joinRequests ?? []).map((request) => ({
          id: request.id,
          login: request.login,
          ...(request.fullName !== undefined ? { fullName: request.fullName } : {}),
          avatar: getImageUrl(request.avatar),
        }))
      ),
    };
  },

  async getOrganizationProjects(
    organizationId: EntityId,
    params: SearchParams = {}
  ): Promise<OrganizationProjectsResult> {
    const response = await apiRequest<BackendProjectDto[]>({ method: 'GET', url: '/api/v1/projects' });
    const normalizedSearch = (params.search ?? '').trim().toLowerCase();

    const data = sortByName(
      response.filter((project) => Number(project.organizationId) === Number(organizationId)).map(mapProjectListItem)
    ).filter(
      (project) =>
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch)
    );

    return { data, total: data.length };
  },

  async getMyOrganizations(_viewerId: EntityId): Promise<Organization[]> {
    void _viewerId;

    const response = await apiRequest<BackendOrganizationDto[]>({ method: 'GET', url: '/api/v1/organizations/my' });

    return sortOrganizations(response.map(mapOrganizationListItem));
  },

  async searchOrganizations(_viewerId: EntityId, params: SearchParams = {}): Promise<OrganizationsResult> {
    const response = await apiRequest<BackendOrganizationDto[]>({ method: 'GET', url: '/api/v1/organizations/search' });
    const normalizedSearch = (params.query ?? '').trim().toLowerCase();

    const data = sortByName(
      response.map((organization) => mapOrganizationListItem({ ...organization, isAdmin: false }))
    ).filter(
      (organization) =>
        !normalizedSearch ||
        organization.name.toLowerCase().includes(normalizedSearch) ||
        (organization.description ?? '').toLowerCase().includes(normalizedSearch)
    );

    return { data, total: data.length };
  },

  async createOrganization(payload: OrganizationCreateFormValues): Promise<OrganizationMutationResult> {
    const data = await apiRequest<{ id?: EntityId }>({
      method: 'POST',
      url: '/api/v1/organizations',
      data: mapCreateOrganizationPayload(payload),
    });

    return data.id === undefined ? { accepted: true } : { accepted: true, organizationId: data.id };
  },

  async updateOrganization(organizationId: EntityId, payload: UpdateOrganizationPayload): Promise<OrganizationDetails> {
    const formData = new FormData();

    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.link !== undefined) formData.append('link', payload.link);
    if (payload.description !== undefined) formData.append('description', payload.description);
    if (payload.logoFile) formData.append('avatar', payload.logoFile);

    return apiRequest<OrganizationDetails>({
      method: 'PATCH',
      url: `/api/v1/organizations/${organizationId}`,
      data: formData,
    });
  },

  async deleteOrganization(organizationId: EntityId): Promise<{ deleted: boolean }> {
    const result = await apiRequest<StatusDto>({ method: 'DELETE', url: `/api/v1/organizations/${organizationId}` });

    return { deleted: Boolean(result.isDeleted ?? result.deleted ?? true) };
  },

  async leaveOrganization(organizationId: EntityId): Promise<{ left: boolean }> {
    const result = await apiRequest<StatusDto>({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/leave`,
    });

    return { left: Boolean(result.isLeft ?? result.left ?? true) };
  },

  async approveOrganizationJoinRequest(
    organizationId: EntityId,
    userId: EntityId
  ): Promise<OrganizationMutationResult> {
    return apiRequest<OrganizationMutationResult>({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/join-requests/${userId}/approve`,
    });
  },

  async rejectOrganizationJoinRequest(organizationId: EntityId, userId: EntityId): Promise<OrganizationMutationResult> {
    return apiRequest<OrganizationMutationResult>({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/join-requests/${userId}/reject`,
    });
  },

  async requestOrganizationAccess(organizationId: EntityId): Promise<OrganizationMutationResult> {
    return apiRequest<OrganizationMutationResult>({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/join-requests`,
    });
  },

  async generateOrganizationInvite(
    organizationId: EntityId,
    payload: InvitePayload
  ): Promise<OrganizationInviteResult> {
    const data = await apiRequest<{ token: string }>({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/invites`,
      data: { ...payload, expiresAt: toBackendLocalDateTime(payload.expiresAt) },
    });

    return { ...data, link: `${window.location.origin}/organizations/join/${data.token}` };
  },

  async joinOrganizationByInvite(token: string): Promise<OrganizationMutationResult> {
    return apiRequest<OrganizationMutationResult>({ method: 'POST', url: `/api/v1/organizations/join/${token}` });
  },

  async getOrganizationInviteInfo(token: string): Promise<Organization> {
    return apiRequest<Organization>({ method: 'GET', url: `/api/v1/organizations/invites/${token}` });
  },
};

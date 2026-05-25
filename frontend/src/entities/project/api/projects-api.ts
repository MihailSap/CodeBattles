import { getProjectTaskSummaries, mapProjectTaskSummaries } from '@/entities/task/@x/project';
import { apiRequest, toBackendLocalDateTime } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import { sortOrganizations, sortParticipants, sortProjects, sortProjectsByName, sortTasks } from '../lib/sorting';
import { PROJECT_MEMBER_ROLE, PROJECT_PRIVACY } from '../model';
import type { EntityId, Project, ProjectParticipant } from '../model/types';
import { MOCK_PROJECTS } from './mocks';

interface BackendParticipantDto {
  id: number;
  login: string;
  email?: string;
  fullName?: string;
  avatar?: string | null;
  role?: ProjectParticipant['role'];
}

interface BackendProjectDto {
  id: EntityId;
  name: string;
  description?: string;
  isPrivate?: boolean;
  organizationId?: EntityId | null;
  organizationName?: string;
  role?: ProjectParticipant['role'];
  viewerRole?: ProjectParticipant['role'];
  participantsCount?: number;
  openTasksCount?: number;
  lastActivityAt?: string | null;
  stack?: string[];
  aiReviewEnabled?: boolean;
  repositoryUrl?: string;
  canSeeTasks?: boolean;
}

interface BackendOrganizationDto {
  id: EntityId;
  name: string;
  logo?: string | null;
  link?: string;
  description?: string;
  isAdmin?: boolean;
  projects?: BackendProjectDto[];
}

export interface ProjectDashboardParams {
  search?: string;
}

export interface ProjectDashboardOrganization {
  id: EntityId;
  logo: string;
  name: string;
  link: string;
  description: string;
  role: 'OWNER' | 'MEMBER';
  projects: Project[];
  hiddenProjectsCount: number;
}

export interface ProjectsDashboard {
  withoutOrganizationProjects: Project[];
  organizationsWithProjects: ProjectDashboardOrganization[];
  noOrgTotal: number;
  organizationsTotal: number;
}

export interface ProjectSearchParams {
  query?: string;
}

export interface ProjectSearchResult {
  data: Project[];
  total: number;
}

export interface CreateProjectPayload {
  organizationId?: EntityId | null;
  name: string;
  description: string;
  repositoryUrl: string;
  stack: string[];
  privacy: Project['privacy'];
  aiReviewEnabled?: boolean;
}

export type UpdateProjectPayload = Partial<Omit<CreateProjectPayload, 'organizationId'>>;

export interface ProjectIdentifierResult {
  accepted: boolean;
  projectId?: EntityId;
}

export interface DeletedResult {
  deleted: boolean;
}

export interface LeftResult {
  left: boolean;
}

export interface GenerateInvitePayload {
  expiresAt: string;
}

export interface InviteResult {
  token: string;
  link: string;
}

interface StatusDto {
  isDeleted?: boolean;
  deleted?: boolean;
  isLeft?: boolean;
  left?: boolean;
}

const mapProjectListItem = (item: BackendProjectDto): Project => ({
  id: item.id,
  name: item.name,
  description: item.description ?? '',
  privacy: item.isPrivate ? PROJECT_PRIVACY.PRIVATE : PROJECT_PRIVACY.PUBLIC,
  organizationId: item.organizationId ?? null,
  organizationName: item.organizationName ?? '',
  role: item.role ?? PROJECT_MEMBER_ROLE.GUEST,
  participantsCount: item.participantsCount ?? 0,
  openTasksCount: item.openTasksCount ?? 0,
  lastActivityAt: item.lastActivityAt ?? null,
});

const mapParticipant = (participant: BackendParticipantDto): ProjectParticipant => ({
  id: participant.id,
  login: participant.login,
  email: participant.email ?? '',
  fullName: participant.fullName ?? '',
  avatar: getImageUrl(participant.avatar),
  role: participant.role ?? PROJECT_MEMBER_ROLE.MEMBER,
});

const mapCreateProjectPayload = (payload: CreateProjectPayload): Record<string, unknown> => ({
  organizationId: payload.organizationId ?? null,
  name: payload.name,
  description: payload.description,
  repositoryUrl: payload.repositoryUrl,
  stack: payload.stack,
  isPrivate: payload.privacy === PROJECT_PRIVACY.PRIVATE,
  aiReviewEnabled: Boolean(payload.aiReviewEnabled),
});

const mapUpdateProjectPayload = (payload: UpdateProjectPayload): Record<string, unknown> => ({
  ...(payload.name !== undefined ? { name: payload.name } : {}),
  ...(payload.description !== undefined ? { description: payload.description } : {}),
  ...(payload.repositoryUrl !== undefined ? { repositoryUrl: payload.repositoryUrl } : {}),
  ...(payload.stack !== undefined ? { stack: payload.stack } : {}),
  ...(payload.privacy !== undefined ? { isPrivate: payload.privacy === PROJECT_PRIVACY.PRIVATE } : {}),
  ...(payload.aiReviewEnabled !== undefined ? { aiReviewEnable: payload.aiReviewEnabled } : {}),
});

export const projectsApi = {
  async getProjectUsers(projectId: EntityId): Promise<ProjectParticipant[]> {
    const response = await apiRequest<BackendParticipantDto[]>({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/participants`,
    });

    return response.map(mapParticipant);
  },

  async getProjectById(projectId: EntityId): Promise<Project> {
    const mockProject = MOCK_PROJECTS.find((project) => project.id === Number(projectId));

    if (mockProject) {
      const viewerRole = mockProject.viewerRole ?? PROJECT_MEMBER_ROLE.OWNER;
      const sortedParticipants = sortParticipants(mockProject.participants.map(mapParticipant));

      return {
        ...mockProject,
        viewerRole,
        participants: sortedParticipants,
        tasks: sortTasks(getProjectTaskSummaries(Number(projectId), sortedParticipants, viewerRole, mockProject)),
      };
    }

    const project = await apiRequest<BackendProjectDto>({
      method: 'GET',
      url: `/api/v1/projects/${projectId}`,
    });

    const participants = await projectsApi.getProjectUsers(projectId);

    const tasks = project.canSeeTasks
      ? await apiRequest<Parameters<typeof mapProjectTaskSummaries>[0]>({
          method: 'GET',
          url: `/api/v1/tasks/by-project/${project.id}`,
        }).catch(() => [])
      : [];

    const viewerRole = project.viewerRole ?? PROJECT_MEMBER_ROLE.GUEST;
    const sortedParticipants = sortParticipants(participants);

    return {
      id: project.id,
      organizationId: project.organizationId ?? null,
      organizationName: project.organizationName ?? '',
      name: project.name,
      description: project.description ?? '',
      stack: project.stack ?? [],
      privacy: project.isPrivate ? PROJECT_PRIVACY.PRIVATE : PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: Boolean(project.aiReviewEnabled),
      repositoryUrl: project.repositoryUrl ?? '',
      lastActivityAt: project.lastActivityAt ?? null,
      viewerRole,
      canSeeTasks: Boolean(project.canSeeTasks),
      participants: sortedParticipants,
      tasks: sortTasks(mapProjectTaskSummaries(tasks, viewerRole, sortedParticipants)),
    };
  },

  async getProjectsDashboard(params: ProjectDashboardParams = {}): Promise<ProjectsDashboard> {
    const { search = '' } = params;

    const [projectsResponse, organizationsResponse] = await Promise.all([
      apiRequest<BackendProjectDto[]>({ method: 'GET', url: '/api/v1/projects' }).catch(() => []),
      apiRequest<BackendOrganizationDto[]>({ method: 'GET', url: '/api/v1/organizations/my-with-projects' }).catch(
        () => []
      ),
    ]);

    const normalizedSearch = search.trim().toLowerCase();

    const apiProjectsWithoutOrganization = projectsResponse
      .filter((project) => !project.organizationId)
      .map(mapProjectListItem);

    const mockProjectsWithoutOrganization: Project[] = MOCK_PROJECTS.filter((project) => !project.organizationId).map(
      (project) => ({
        ...project,
        role: project.viewerRole ?? PROJECT_MEMBER_ROLE.GUEST,
      })
    );

    const withoutOrganizationProjects = sortProjects([
      ...apiProjectsWithoutOrganization,
      ...mockProjectsWithoutOrganization,
    ]).filter(
      (project) =>
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        (project.description ?? '').toLowerCase().includes(normalizedSearch)
    );

    const apiOrganizations: ProjectDashboardOrganization[] = organizationsResponse.map((organization) => ({
      id: organization.id,
      logo: getImageUrl(organization.logo),
      name: organization.name,
      link: organization.link ?? '',
      description: organization.description ?? '',
      role: organization.isAdmin ? 'OWNER' : 'MEMBER',
      projects: sortProjects((organization.projects ?? []).map(mapProjectListItem)),
      hiddenProjectsCount: 0,
    }));

    const mockOrganizations = new Map<EntityId, ProjectDashboardOrganization>();

    MOCK_PROJECTS.forEach((project) => {
      if (project.organizationId && !mockOrganizations.has(project.organizationId)) {
        mockOrganizations.set(project.organizationId, {
          id: project.organizationId,
          name: project.organizationName ?? `Org ${project.organizationId}`,
          logo: '',
          link: '',
          description: 'Моковая организация для демонстрации',
          role: 'MEMBER',
          projects: [],
          hiddenProjectsCount: 0,
        });
      }
    });

    const organizations = [...apiOrganizations];
    const apiOrganizationIds = new Set(apiOrganizations.map((organization) => organization.id));

    mockOrganizations.forEach((organization, id) => {
      if (!apiOrganizationIds.has(id)) {
        organizations.push(organization);
      }
    });

    organizations.forEach((organization) => {
      const mockProjects: Project[] = MOCK_PROJECTS.filter((project) => project.organizationId === organization.id).map(
        (project) => ({
          ...project,
          role: project.viewerRole ?? PROJECT_MEMBER_ROLE.GUEST,
        })
      );

      const existingIds = new Set(organization.projects.map((project) => project.id));

      organization.projects = sortProjects([
        ...organization.projects,
        ...mockProjects.filter((project) => !existingIds.has(project.id)),
      ]);
    });

    const organizationsWithProjects = sortOrganizations(
      organizations.filter(
        (organization) =>
          !normalizedSearch ||
          organization.name.toLowerCase().includes(normalizedSearch) ||
          organization.description.toLowerCase().includes(normalizedSearch)
      )
    );

    return {
      withoutOrganizationProjects,
      organizationsWithProjects,
      noOrgTotal: withoutOrganizationProjects.length,
      organizationsTotal: organizationsWithProjects.length,
    };
  },

  async searchProjectsForJoin(_viewerId: EntityId, params: ProjectSearchParams = {}): Promise<ProjectSearchResult> {
    const { query = '' } = params;
    const response = await apiRequest<BackendProjectDto[]>({ method: 'GET', url: '/api/v1/projects/public/search' });
    const normalizedSearch = query.trim().toLowerCase();

    const data = sortProjectsByName(response.map(mapProjectListItem)).filter(
      (project) =>
        !normalizedSearch ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        (project.description ?? '').toLowerCase().includes(normalizedSearch)
    );

    return { data, total: data.length };
  },

  async createProject(payload: CreateProjectPayload): Promise<ProjectIdentifierResult> {
    const data = await apiRequest<{ id?: EntityId }>({
      method: 'POST',
      url: '/api/v1/projects',
      data: mapCreateProjectPayload(payload),
    });

    return data.id === undefined ? { accepted: true } : { accepted: true, projectId: data.id };
  },

  async updateProject(projectId: EntityId, payload: UpdateProjectPayload): Promise<Project> {
    return apiRequest<Project>({
      method: 'PATCH',
      url: `/api/v1/projects/${projectId}`,
      data: mapUpdateProjectPayload(payload),
    });
  },

  async deleteProject(projectId: EntityId): Promise<DeletedResult> {
    const result = await apiRequest<StatusDto>({ method: 'DELETE', url: `/api/v1/projects/${projectId}` });

    return { deleted: Boolean(result.isDeleted ?? result.deleted ?? true) };
  },

  async leaveProject(projectId: EntityId): Promise<LeftResult> {
    const result = await apiRequest<StatusDto>({ method: 'POST', url: `/api/v1/projects/${projectId}/leave` });

    return { left: Boolean(result.isLeft ?? result.left ?? true) };
  },

  async joinPublicProject(projectId: EntityId): Promise<ProjectIdentifierResult> {
    return apiRequest<ProjectIdentifierResult>({ method: 'POST', url: `/api/v1/projects/${projectId}/join` });
  },

  async generateProjectInvite(projectId: EntityId, payload: GenerateInvitePayload): Promise<InviteResult> {
    const data = await apiRequest<{ token: string }>({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/invites`,
      data: { ...payload, expiresAt: toBackendLocalDateTime(payload.expiresAt) },
    });

    return { ...data, link: `${window.location.origin}/projects/join/${data.token}` };
  },

  async joinByInvite(token: string): Promise<ProjectIdentifierResult> {
    return apiRequest<ProjectIdentifierResult>({ method: 'POST', url: `/api/v1/project-invites/${token}/join` });
  },

  async getInviteInfo(token: string): Promise<Project> {
    return apiRequest<Project>({ method: 'GET', url: `/api/v1/project-invites/${token}` });
  },
};

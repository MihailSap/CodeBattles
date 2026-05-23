import { httpClient } from '@/shared/api';
import { PROJECT_MEMBER_ROLE, PROJECT_PRIVACY, TASK_STATUS } from '../model';
import { getImageUrl } from '@/shared/lib';
import {
  sortOrganizations,
  sortOrganizationsByName,
  sortProjects,
  sortProjectsByName,
  sortParticipants,
  sortJoinRequests,
  sortTasks,
} from '../lib/sorting';
const clone = (value: LegacyValue) => JSON.parse(JSON.stringify(value));

const parseBackendMessage = (message: LegacyValue) => {
  if (typeof message !== 'string') {
    return null;
  }

  const match = message.trim().match(/^(\d{3})\s+([A-Z0-9_\-']+)/);

  if (!match) {
    return null;
  }

  return {
    status: Number(match[1]),
    code: match[2],
  };
};

const toDomainError = (error: LegacyValue) => {
  const response = error?.response;
  const backendMessage = response?.data?.message;
  const parsed = parseBackendMessage(backendMessage);
  const nextError = new Error(response?.data?.message || error?.message || 'Request failed');
  nextError.status = parsed?.status || response?.status || 500;
  nextError.code = parsed?.code;
  nextError.raw = error;

  if (!nextError.code && typeof backendMessage === 'string') {
    nextError.code = backendMessage;
  }

  return nextError;
};

const request = async (config: LegacyValue) => {
  try {
    const response = await httpClient(config);

    return response.data;
  } catch (error: LegacyValue) {
    throw toDomainError(error);
  }
};

const mapProjectListItem = (item: LegacyValue) => ({
  id: item.id,
  name: item.name,
  description: item.description || '',
  privacy: item.isPrivate ? PROJECT_PRIVACY.PRIVATE : PROJECT_PRIVACY.PUBLIC,
  organizationId: item.organizationId,
  organizationName: item.organizationName || '',
  role: item.role || PROJECT_MEMBER_ROLE.GUEST,
  participantsCount: item.participantsCount || 0,
  openTasksCount: item.openTasksCount || 0,
  lastActivityAt: item.lastActivityAt || null,
});

const mapParticipant = (participant: LegacyValue) => ({
  id: participant.id,
  login: participant.login,
  email: participant.email || '',
  fullName: participant.fullName || '',
  avatar: getImageUrl(participant.avatar),
  role: participant.role || PROJECT_MEMBER_ROLE.MEMBER,
});

const isMockProjectId = (projectId: LegacyValue) =>
  MOCK_PROJECTS.some((project: LegacyValue) => Number(project.id) === Number(projectId));

const getParticipantsById = (participants: LegacyValue = []) =>
  new Map(participants.map((participant: LegacyValue) => [Number(participant.id), participant]));

const resolveParticipantsByIds = (ids: LegacyValue = [], participants: LegacyValue = []) => {
  const participantsById = getParticipantsById(participants);

  return ids
    .map((id: LegacyValue) => participantsById.get(Number(id)))
    .filter(Boolean)
    .map(mapParticipant);
};

const resolveAvailableParticipants = (ids: LegacyValue = [], fallbackParticipants: LegacyValue = []) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return fallbackParticipants.map(mapParticipant);
  }

  return resolveParticipantsByIds(ids, fallbackParticipants);
};

const mapTaskFromBackend = (task: LegacyValue, projectViewerRole: LegacyValue, allParticipants: LegacyValue) => {
  const assignees = (task.assignees || []).map(mapParticipant);
  const reviewers = (task.reviewers || []).map(mapParticipant);
  const assigneeIds = assignees.map((participant: LegacyValue) => participant.id);
  const reviewerIds = reviewers.map((participant: LegacyValue) => participant.id);

  return {
    id: task.id,
    projectId: task.projectId,
    projectName: task.projectName || '',
    name: task.name || '',
    description: task.description || '',
    requirements: task.requirements || '',
    evaluationCriteria: task.evaluationCriteria || '',
    status: task.status,
    deadline: task.deadline,
    reviewType: task.reviewType,
    assignees,
    reviewers,
    assigneeIds,
    reviewerIds,
    viewerRole: projectViewerRole,
    commentsCount: task.commentsCount || 0,
    hasSolution: Boolean(task.hasSolution),
    createdAt: task.createdAt || '',
    updatedAt: task.updatedAt || '',
    isMock: false,
    canManageSettings: Boolean(
      task.permissions?.canManageSettings ?? [TASK_STATUS.IN_PROGRESS, TASK_STATUS.REWORK].includes(task.status)
    ),
    availableAssignees: clone(allParticipants),
    availableReviewers: clone(allParticipants),
  };
};

const mapTaskDetailsFromBackend = (task: LegacyValue, participants: LegacyValue, projectViewerRole: LegacyValue) => {
  const assigneeIds = Array.isArray(task.assigneeIds) ? task.assigneeIds : [];
  const reviewerIds = Array.isArray(task.reviewerIds) ? task.reviewerIds : [];
  const viewerRole = task.permissions?.viewerRole || projectViewerRole || PROJECT_MEMBER_ROLE.GUEST;

  return {
    id: task.id,
    projectId: task.projectId,
    organizationId: task.organizationId,
    projectName: task.projectName || '',
    projectPrivacy: task.isProjectPrivate ? PROJECT_PRIVACY.PRIVATE : PROJECT_PRIVACY.PUBLIC,
    aiReviewEnabled: Boolean(task.aiReviewEnabled),
    name: task.name || '',
    description: task.description || '',
    requirements: task.requirements || '',
    evaluationCriteria: task.evaluationCriteria || '',
    status: task.status,
    deadline: task.deadline,
    reviewType: task.reviewType,
    assigneeIds,
    reviewerIds,
    assignees: resolveParticipantsByIds(assigneeIds, participants),
    reviewers: resolveParticipantsByIds(reviewerIds, participants),
    availableAssignees: resolveAvailableParticipants(task.availableAssignees, participants),
    availableReviewers: resolveAvailableParticipants(task.availableReviewers, participants),
    viewerRole,
    canViewTask: Boolean(task.permissions?.canViewTask ?? true),
    canManageSettings: Boolean(task.permissions?.canManageSettings ?? viewerRole === PROJECT_MEMBER_ROLE.OWNER),
    canUploadSolution: Boolean(task.permissions?.canUploadSolution ?? false),
    canFinishReview: Boolean(task.permissions?.canFinishReview ?? false),
    createdAt: task.createdAt || '',
    updatedAt: task.updatedAt || '',
    isMock: false,
  };
};

const mapOrganizationListItem = (item: LegacyValue) => ({
  id: item.id,
  logo: getImageUrl(item.logo),
  name: item.name,
  link: item.link || '',
  description: item.description || '',
  participantsCount: item.participantsCount || 0,
  projectsCount: item.projectsCount || 0,
  role: item.isAdmin ? 'OWNER' : 'MEMBER',
  hasPendingRequest: Boolean(item.hasPendingRequest),
});

const mapCreateProjectPayload = (payload: LegacyValue) => ({
  organizationId: payload.organizationId ?? null,
  name: payload.name,
  description: payload.description || '',
  repositoryUrl: payload.repositoryUrl || '',
  stack: payload.stack || [],
  isPrivate: payload.privacy === PROJECT_PRIVACY.PRIVATE,
  aiReviewEnabled: Boolean(payload.aiReviewEnabled),
});

const mapCreateOrganizationPayload = (payload: LegacyValue) => {
  const formData = new FormData();
  formData.append('name', payload.name);
  if (payload.link) formData.append('link', payload.link);
  if (payload.description) formData.append('description', payload.description);
  if (payload.logoFile) formData.append('logo', payload.logoFile);

  return formData;
};

const mapUpdateProjectPayload = (payload: LegacyValue) => ({
  ...(payload.name !== undefined
    ? {
        name: payload.name,
      }
    : {}),
  ...(payload.description !== undefined
    ? {
        description: payload.description,
      }
    : {}),
  ...(payload.repositoryUrl !== undefined
    ? {
        repositoryUrl: payload.repositoryUrl,
      }
    : {}),
  ...(payload.stack !== undefined
    ? {
        stack: payload.stack,
      }
    : {}),
  ...(payload.privacy !== undefined
    ? {
        isPrivate: payload.privacy === PROJECT_PRIVACY.PRIVATE,
      }
    : {}),
  ...(payload.aiReviewEnabled !== undefined
    ? {
        aiReviewEnable: Boolean(payload.aiReviewEnabled),
      }
    : {}),
});

const toBackendLocalDateTime = (value: LegacyValue) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (num: LegacyValue) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const makeDate = (daysFromNow: LegacyValue, hour: LegacyValue, minute: LegacyValue) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
};

import { MOCK_PROJECTS, MOCK_TASKS, mockUsersById } from './mocks';
import { MOCK_REVIEWS_STORE, MOCK_ASSIGNED_REVIEWS } from './mocks/reviews';
import { MOCK_LARGE_FILE_TREE } from './mocks/content';

const taskMockStore = new Map();
const reviewMockStore = MOCK_REVIEWS_STORE;
const getMockTaskKey = (projectId: LegacyValue) => String(projectId);

const MOCK_TASKS_BY_PROJECT = MOCK_TASKS.reduce((accumulator: LegacyValue, task: LegacyValue) => {
  const key = String(task.projectId);
  const current = accumulator.get(key) || [];
  accumulator.set(key, [...current, task]);

  return accumulator;
}, new Map());

const getMockTasksForProject = (projectId: LegacyValue) => MOCK_TASKS_BY_PROJECT.get(getMockTaskKey(projectId)) || [];

const createFallbackParticipant = (id: LegacyValue) => ({
  id: Number(id),
  ...(mockUsersById.get(Number(id)) || {}),
  login: mockUsersById.get(Number(id))?.login || '',
  email: mockUsersById.get(Number(id))?.email || '',
  fullName: mockUsersById.get(Number(id))?.fullName || '',
  avatar: getImageUrl(mockUsersById.get(Number(id))?.avatar),
  role: PROJECT_MEMBER_ROLE.MEMBER,
});

const normalizeTaskRecord = (task: LegacyValue) => ({
  ...clone(task),
  assigneeIds: Array.isArray(task.assigneeIds) ? [...task.assigneeIds] : [],
  reviewerIds: Array.isArray(task.reviewerIds) ? [...task.reviewerIds] : [],
  assignees: Array.isArray(task.assignees) ? task.assignees.map(mapParticipant) : [],
  reviewers: Array.isArray(task.reviewers) ? task.reviewers.map(mapParticipant) : [],
  availableAssignees: Array.isArray(task.availableAssignees) ? task.availableAssignees.map(mapParticipant) : [],
  availableReviewers: Array.isArray(task.availableReviewers) ? task.availableReviewers.map(mapParticipant) : [],
});

const hydrateMockTask = (task: LegacyValue, project: LegacyValue) => {
  const participants = project?.participants || [];

  const participantsById = new Map(
    participants.map((participant: LegacyValue) => [Number(participant.id), participant])
  );

  const resolveParticipant = (id: LegacyValue) =>
    mapParticipant(participantsById.get(Number(id)) || mockUsersById.get(Number(id)) || createFallbackParticipant(id));

  return {
    ...normalizeTaskRecord(task),
    projectName: project?.name || 'Unknown Project',
    projectPrivacy: project?.privacy || PROJECT_PRIVACY.PUBLIC,
    assignees: (task.assigneeIds || []).map(resolveParticipant),
    reviewers: (task.reviewerIds || []).map(resolveParticipant),
    viewerRole: project?.viewerRole || PROJECT_MEMBER_ROLE.GUEST,
    canManageSettings: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.REWORK].includes(task.status),
    isMock: true,
    availableAssignees: clone(participants),
    availableReviewers: clone(participants),
  };
};

const seedMockTasksForProject = (
  projectId: LegacyValue,
  participants: LegacyValue = [],
  projectViewerRole: LegacyValue = PROJECT_MEMBER_ROLE.GUEST
) => {
  const key = getMockTaskKey(projectId);

  if (taskMockStore.has(key)) {
    return taskMockStore.get(key).map(normalizeTaskRecord);
  }

  const seedTasks = getMockTasksForProject(projectId);

  if (seedTasks.length === 0) {
    return [];
  }

  const actualMockProject = MOCK_PROJECTS.find((p: LegacyValue) => p.id === Number(projectId));

  const mockProject = {
    participants,
    viewerRole: projectViewerRole,
    name: actualMockProject?.name || 'Unknown Project',
    privacy: actualMockProject?.privacy || 'PRIVATE',
  };

  const hydrated = seedTasks.map((task: LegacyValue) => hydrateMockTask(task, mockProject));
  taskMockStore.set(key, hydrated);

  return hydrated.map(normalizeTaskRecord);
};

export const projectsApi: LegacyValue = {
  async getProjectUsers(projectId: LegacyValue) {
    const response = await request({
      method: 'GET',
      url: `/api/v1/projects/${projectId}/participants`,
    });

    return (response || []).map((user: LegacyValue) => ({
      id: user.id,
      login: user.login,
      email: user.email || '',
      fullName: user.fullName || '',
      avatar: getImageUrl(user.avatar),
      role: user.role,
    }));
  },
  async getProjectById(projectId: LegacyValue) {
    const projId = Number(projectId);
    const mockProj = MOCK_PROJECTS.find((p: LegacyValue) => p.id === projId);

    if (mockProj) {
      const viewerRole = mockProj.viewerRole || PROJECT_MEMBER_ROLE.OWNER;
      const sortedParticipants = sortParticipants(mockProj.participants || []);
      const tasks = seedMockTasksForProject(projId, sortedParticipants, viewerRole);

      return {
        ...mockProj,
        viewerRole,
        participants: sortedParticipants,
        tasks: sortTasks(tasks),
      };
    }

    const project = await request({
      method: 'GET',
      url: `/api/v1/projects/${projectId}`,
    });

    const participants = await this.getProjectUsers(projectId);

    const tasks = project.canSeeTasks
      ? await request({
          method: 'GET',
          url: `/api/v1/tasks/tasks/by-project/${project.id}`,
        }).catch(() => [])
      : [];

    const viewerRole = project.viewerRole || PROJECT_MEMBER_ROLE.GUEST;
    const sortedParticipants = sortParticipants(participants || []);

    const normalizedTasks = (tasks || []).map((task: LegacyValue) =>
      mapTaskFromBackend(task, viewerRole, sortedParticipants)
    );

    return {
      id: project.id,
      organizationId: project.organizationId,
      organizationName: project.organizationName || '',
      name: project.name,
      description: project.description || '',
      stack: project.stack || [],
      privacy: project.isPrivate ? PROJECT_PRIVACY.PRIVATE : PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: Boolean(project.aiReviewEnabled),
      repositoryUrl: project.repositoryUrl || '',
      lastActivityAt: project.lastActivityAt || null,
      viewerRole,
      canSeeTasks: Boolean(project.canSeeTasks),
      participants: sortedParticipants,
      tasks: sortTasks(normalizedTasks),
    };
  },
  async getTaskById(projectId: LegacyValue, taskId: LegacyValue) {
    if (!isMockProjectId(projectId)) {
      const task = await request({
        method: 'GET',
        url: `/api/v1/tasks/tasks/${taskId}`,
      });

      const participants = await this.getProjectUsers(task.projectId || projectId).catch(() => []);

      const project = await request({
        method: 'GET',
        url: `/api/v1/projects/${task.projectId || projectId}`,
      }).catch(() => null);

      const viewerRole = project?.viewerRole || task.permissions?.viewerRole || PROJECT_MEMBER_ROLE.GUEST;
      const sortedParticipants = sortParticipants(participants || []);

      return mapTaskDetailsFromBackend(task, sortedParticipants, viewerRole);
    }

    let tasks = taskMockStore.get(getMockTaskKey(projectId)) || [];

    if (tasks.length === 0) {
      await this.getProjectById(projectId);
      tasks = taskMockStore.get(getMockTaskKey(projectId)) || [];
    }

    let task = tasks.find((item: LegacyValue) => Number(item.id) === Number(taskId));

    if (!task) {
      task = MOCK_TASKS.find((item: LegacyValue) => Number(item.id) === Number(taskId));
    }

    if (!task) {
      const error = new Error('Задача не найдена');
      error.status = 404;
      throw error;
    }

    const project = await this.getProjectById(projectId);

    return hydrateMockTask(task, project);
  },
  async createProject(payload: LegacyValue) {
    const data = await request({
      method: 'POST',
      url: '/api/v1/projects',
      data: mapCreateProjectPayload(payload),
    });

    return {
      accepted: true,
      projectId: data?.id,
    };
  },
  async updateProject(projectId: LegacyValue, payload: LegacyValue) {
    return request({
      method: 'PATCH',
      url: `/api/v1/projects/${projectId}`,
      data: mapUpdateProjectPayload(payload),
    });
  },
  async deleteProject(projectId: LegacyValue) {
    const result = await request({
      method: 'DELETE',
      url: `/api/v1/projects/${projectId}`,
    });

    return {
      deleted: Boolean(result?.isDeleted ?? result?.deleted ?? true),
    };
  },
  async createTask(projectId: LegacyValue, payload: LegacyValue) {
    if (isMockProjectId(projectId)) {
      const project = await this.getProjectById(projectId);
      const key = getMockTaskKey(projectId);
      const tasks = taskMockStore.get(key) || [];

      const nextId =
        Math.max(
          0,
          ...MOCK_TASKS.map((task: LegacyValue) => Number(task.id)),
          ...tasks.map((task: LegacyValue) => Number(task.id))
        ) + 1;

      const nextTask = hydrateMockTask(
        {
          id: nextId,
          projectId: Number(projectId),
          status: TASK_STATUS.IN_PROGRESS,
          ...payload,
          deadline: payload.deadline,
        },
        project
      );

      taskMockStore.set(key, [...tasks, nextTask]);

      return {
        accepted: true,
        taskId: nextId,
      };
    }

    const data = await request({
      method: 'POST',
      url: '/api/v1/tasks/tasks',
      data: {
        ...payload,
        projectId: Number(projectId),
        deadline: toBackendLocalDateTime(payload.deadline),
      },
    });

    return {
      accepted: true,
      taskId: data?.id,
    };
  },
  async updateTask(taskId: LegacyValue, payload: LegacyValue) {
    for (const [key, tasks] of taskMockStore.entries()) {
      const index = tasks.findIndex((item: LegacyValue) => Number(item.id) === Number(taskId));

      if (index < 0) {
        continue;
      }

      const nextTask = {
        ...tasks[index],
        ...payload,
      };

      const nextTasks = [...tasks];
      nextTasks[index] = nextTask;
      taskMockStore.set(key, nextTasks);

      return clone(nextTask);
    }

    const data = await request({
      method: 'PATCH',
      url: `/api/v1/tasks/tasks/${taskId}`,
      data: {
        ...payload,
        ...(payload.deadline !== undefined
          ? {
              deadline: toBackendLocalDateTime(payload.deadline),
            }
          : {}),
      },
    });

    return data;
  },
  async deleteTask(taskId: LegacyValue) {
    for (const [key, tasks] of taskMockStore.entries()) {
      const nextTasks = tasks.filter((item: LegacyValue) => Number(item.id) !== Number(taskId));

      if (nextTasks.length !== tasks.length) {
        taskMockStore.set(key, nextTasks);

        return {
          deleted: true,
        };
      }
    }

    const result = await request({
      method: 'DELETE',
      url: `/api/v1/tasks/tasks/${taskId}`,
    });

    return {
      deleted: Boolean(result?.isDeleted ?? result?.deleted ?? true),
    };
  },
  async leaveProject(projectId: LegacyValue) {
    const result = await request({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/leave`,
    });

    return {
      left: Boolean(result?.isLeft ?? result?.left ?? true),
    };
  },
  async generateProjectInvite(projectId: LegacyValue, payload: LegacyValue) {
    const data = await request({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/invites`,
      data: {
        ...payload,
        expiresAt: toBackendLocalDateTime(payload.expiresAt),
      },
    });

    return {
      ...data,
      link: `${window.location.origin}/projects/join/${data.token}`,
    };
  },
  async joinByInvite(token: LegacyValue) {
    return request({
      method: 'POST',
      url: `/api/v1/project-invites/${token}/join`,
    });
  },
  async getInviteInfo(token: LegacyValue) {
    return request({
      method: 'GET',
      url: `/api/v1/project-invites/${token}`,
    });
  },
  async generateOrganizationInvite(organizationId: LegacyValue, payload: LegacyValue) {
    const data = await request({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/invites`,
      data: {
        ...payload,
        expiresAt: toBackendLocalDateTime(payload.expiresAt),
      },
    });

    return {
      ...data,
      link: `${window.location.origin}/organizations/join/${data.token}`,
    };
  },
  async joinOrganizationByInvite(token: LegacyValue) {
    return request({
      method: 'POST',
      url: `/api/v1/organizations/join/${token}`,
    });
  },
  async getOrganizationInviteInfo(token: LegacyValue) {
    return request({
      method: 'GET',
      url: `/api/v1/organizations/invites/${token}`,
    });
  },
  async getProjectsDashboard(params: LegacyValue = {}) {
    const { search = '' } = params;

    const [projectsResponse, organizationsResponse] = await Promise.all([
      request({
        method: 'GET',
        url: '/api/v1/projects',
      }).catch(() => []),
      request({
        method: 'GET',
        url: '/api/v1/organizations/my-with-projects',
      }).catch(() => []),
    ]);

    const normalizedSearch = search.trim().toLowerCase();

    const apiProjectsWithoutOrg = (projectsResponse || [])
      .filter((project: LegacyValue) => !project.organizationId)
      .map(mapProjectListItem);

    const mockProjectsWithoutOrg = MOCK_PROJECTS.filter((project: LegacyValue) => !project.organizationId).map(
      (p: LegacyValue) => ({
        ...p,
        role: p.viewerRole || PROJECT_MEMBER_ROLE.GUEST,
      })
    );

    const allWithoutOrg = sortProjects([...apiProjectsWithoutOrg, ...mockProjectsWithoutOrg]).filter(
      (p: LegacyValue) => {
        if (!normalizedSearch) return true;

        return (
          p.name.toLowerCase().includes(normalizedSearch) ||
          (p.description || '').toLowerCase().includes(normalizedSearch)
        );
      }
    );

    const apiOrganizations = (organizationsResponse || []).map((organization: LegacyValue) => ({
      id: organization.id,
      logo: getImageUrl(organization.logo),
      name: organization.name,
      link: organization.link || '',
      description: organization.description || '',
      role: organization.isAdmin ? 'OWNER' : 'MEMBER',
      projects: sortProjects((organization.projects || []).map(mapProjectListItem)),
      hiddenProjectsCount: 0,
    }));

    const mockOrgsMap = new Map();

    MOCK_PROJECTS.forEach((p: LegacyValue) => {
      if (p.organizationId && !mockOrgsMap.has(p.organizationId)) {
        mockOrgsMap.set(p.organizationId, {
          id: p.organizationId,
          name: p.organizationName || `Org ${p.organizationId}`,
          logo: '',
          link: '',
          description: 'Моковая организация для демонстрации',
          role: 'MEMBER',
          projects: [],
          hiddenProjectsCount: 0,
        });
      }
    });

    const allOrganizations = [...apiOrganizations];
    const apiOrgIds = new Set(apiOrganizations.map((o: LegacyValue) => o.id));

    mockOrgsMap.forEach((mockOrg: LegacyValue, id: LegacyValue) => {
      if (!apiOrgIds.has(id)) {
        allOrganizations.push(mockOrg);
      }
    });

    allOrganizations.forEach((org: LegacyValue) => {
      const orgMocks = MOCK_PROJECTS.filter((p: LegacyValue) => p.organizationId === org.id).map((p: LegacyValue) => ({
        ...p,
        role: p.viewerRole || PROJECT_MEMBER_ROLE.GUEST,
      }));

      const existingIds = new Set(org.projects.map((p: LegacyValue) => p.id));
      const uniqueMocks = orgMocks.filter((p: LegacyValue) => !existingIds.has(p.id));
      org.projects = sortProjects([...org.projects, ...uniqueMocks]);
    });

    const organizationsWithProjects = sortOrganizations(
      allOrganizations.filter((org: LegacyValue) => {
        if (!normalizedSearch) return org.projects;

        return (
          org.name.toLowerCase().includes(normalizedSearch) ||
          (org.description || '').toLowerCase().includes(normalizedSearch)
        );
      })
    );

    return {
      withoutOrganizationProjects: allWithoutOrg,
      organizationsWithProjects,
      noOrgTotal: allWithoutOrg.length,
      organizationsTotal: organizationsWithProjects.length,
    };
  },
  async getOrganizationProjects(organizationId: LegacyValue, params: LegacyValue = {}) {
    const { search = '' } = params;

    const response = await request({
      method: 'GET',
      url: '/api/v1/projects',
    });

    const normalizedSearch = search.trim().toLowerCase();

    const filtered = sortProjects(
      (response || [])
        .filter((project: LegacyValue) => Number(project.organizationId) === Number(organizationId))
        .map(mapProjectListItem)
    ).filter((p: LegacyValue) => {
      if (!normalizedSearch) return true;

      return (
        p.name.toLowerCase().includes(normalizedSearch) ||
        (p.description || '').toLowerCase().includes(normalizedSearch)
      );
    });

    const mapped = filtered.map((item: LegacyValue) => {
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        activeTasksCount: item.openTasksCount,
        participants: [],
        participantsCount: item.participantsCount,
        viewerRole: item.role,
      };
    });

    return {
      data: mapped,
      total: mapped.length,
    };
  },
  async getMyOrganizations(viewerId: LegacyValue) {
    void viewerId;

    const response = await request({
      method: 'GET',
      url: '/api/v1/organizations/my',
    });

    const sorted = sortOrganizations(
      (response || []).map((org: LegacyValue) =>
        mapOrganizationListItem({
          ...org,
        })
      )
    );

    return sorted;
  },
  async getOrganizationById(organizationId: LegacyValue) {
    const organization = await request({
      method: 'GET',
      url: `/api/v1/organizations/${organizationId}`,
    });

    return {
      id: organization.id,
      name: organization.name,
      description: organization.description || '',
      link: organization.link || '',
      logoUrl: getImageUrl(organization.logoUrl),
      ownerId: organization.ownerId,
      viewerRole: organization.viewerRole,
      participants: sortParticipants(
        (organization.participants || []).map((participant: LegacyValue) => ({
          ...participant,
          avatar: getImageUrl(participant.avatar),
          role: participant.role || 'MEMBER',
        }))
      ),
      projects: sortProjects(
        (organization.projects || []).map((project: LegacyValue) => ({
          id: project.id,
          name: project.name,
          description: project.description || '',
          activeTasksCount: project.activeTasksCount || 0,
          participants: (project.participants || []).map(mapParticipant),
          viewerRole: project.viewerRole || PROJECT_MEMBER_ROLE.GUEST,
        }))
      ),
      joinRequests: sortJoinRequests(
        (organization.joinRequests || []).map((request: LegacyValue) => ({
          ...request,
          avatar: getImageUrl(request.avatar),
        }))
      ),
    };
  },
  async updateOrganization(organizationId: LegacyValue, payload: LegacyValue) {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append('name', payload.name);
    if (payload.link !== undefined) formData.append('link', payload.link);
    if (payload.description !== undefined) formData.append('description', payload.description);

    if (payload.logoFile) {
      formData.append('avatar', payload.logoFile);
    }

    return request({
      method: 'PATCH',
      url: `/api/v1/organizations/${organizationId}`,
      data: formData,
    });
  },
  async leaveOrganization(organizationId: LegacyValue) {
    const result = await request({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/leave`,
    });

    return {
      left: Boolean(result?.isLeft ?? result?.left ?? true),
    };
  },
  async deleteOrganization(organizationId: LegacyValue) {
    const result = await request({
      method: 'DELETE',
      url: `/api/v1/organizations/${organizationId}`,
    });

    return {
      deleted: Boolean(result?.isDeleted ?? result?.deleted ?? true),
    };
  },
  async searchProjectsForJoin(viewerId: LegacyValue, params: LegacyValue = {}) {
    void viewerId;
    const { query = '' } = params;

    const response = await request({
      method: 'GET',
      url: '/api/v1/projects/public/search',
    });

    const normalizedSearch = query.trim().toLowerCase();

    const filtered = sortProjectsByName((response || []).map(mapProjectListItem)).filter((p: LegacyValue) => {
      if (!normalizedSearch) return true;

      return (
        p.name.toLowerCase().includes(normalizedSearch) ||
        (p.description || '').toLowerCase().includes(normalizedSearch)
      );
    });

    return {
      data: filtered,
      total: filtered.length,
    };
  },
  async searchOrganizations(viewerId: LegacyValue, params: LegacyValue = {}) {
    void viewerId;
    const { query = '' } = params;

    const response = await request({
      method: 'GET',
      url: '/api/v1/organizations/search',
    });

    const normalizedSearch = query.trim().toLowerCase();

    const filtered = sortOrganizationsByName(
      (response || []).map((org: LegacyValue) =>
        mapOrganizationListItem({
          ...org,
          isAdmin: false,
        })
      )
    ).filter((o: LegacyValue) => {
      if (!normalizedSearch) return true;

      return (
        o.name.toLowerCase().includes(normalizedSearch) ||
        (o.description || '').toLowerCase().includes(normalizedSearch)
      );
    });

    return {
      data: filtered,
      total: filtered.length,
    };
  },
  async joinPublicProject(projectId: LegacyValue) {
    return request({
      method: 'POST',
      url: `/api/v1/projects/${projectId}/join`,
    });
  },
  async requestOrganizationAccess(organizationId: LegacyValue) {
    return request({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/join-requests`,
    });
  },
  async approveOrganizationJoinRequest(organizationId: LegacyValue, requestUserId: LegacyValue) {
    return request({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/join-requests/${requestUserId}/approve`,
    });
  },
  async rejectOrganizationJoinRequest(organizationId: LegacyValue, requestUserId: LegacyValue) {
    return request({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/join-requests/${requestUserId}/reject`,
    });
  },
  async createOrganization(payload: LegacyValue) {
    const data = await request({
      method: 'POST',
      url: '/api/v1/organizations',
      data: mapCreateOrganizationPayload(payload),
    });

    return {
      accepted: true,
      organizationId: data?.id,
    };
  },
  async submitSolution(taskId: LegacyValue, payload: LegacyValue) {
    const nextReview = {
      id: Date.now(),
      taskId: Number(taskId),
      status: 'WAITING',
      uploadedAt: new Date().toISOString(),
      deadline: makeDate(14, 18, 0),
      files: payload.files || [],
      comments: [],
      finalReviews: [],
      history: [],
      revealAuthorAfterReview: Boolean(payload?.revealAuthorAfterReview),
      aiEvaluation: {
        qualityScore: 4.2,
        cyclomaticComplexity: 'B (Хорошо)',
        solidViolations: {
          count: 2,
          severity: 'Не критично',
        },
      },
      aiReviewEvaluation: null,
    };

    reviewMockStore.set(Number(taskId), nextReview as LegacyValue);

    await this.updateTask(taskId, {
      status: TASK_STATUS.IN_REVIEW,
    });

    return nextReview;
  },
  async getReviewByTaskId(taskId: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));

    if (!review) {
      return null;
    }

    return clone(review);
  },
  async getReviewById(reviewId: LegacyValue) {
    const numId = Number(reviewId);

    for (const [, review] of reviewMockStore) {
      if ((review as LegacyValue).id === numId) {
        return {
          ...clone(review),
          projectId: (review as LegacyValue).projectId || 9999,
        };
      }
    }

    return null;
  },
  async getReviewFileContent(reviewIdOrTaskId: LegacyValue, filePath: LegacyValue) {
    let review = reviewMockStore.get(Number(reviewIdOrTaskId));

    if (!review) {
      const numId = Number(reviewIdOrTaskId);

      for (const [, r] of reviewMockStore) {
        if (r.id === numId) {
          review = r;
          break;
        }
      }
    }

    if (!review) throw new Error('Review not found');

    const findFile = (nodes: LegacyValue): LegacyValue => {
      for (const node of nodes) {
        if (node.path === filePath) return node;

        if (node.children) {
          const found: LegacyValue = findFile(node.children);
          if (found) return found;
        }
      }

      return null;
    };

    const files = review.files && review.files.length > 0 ? review.files : MOCK_LARGE_FILE_TREE;
    const file = findFile(files);
    if (!file) throw new Error('File not found');

    return {
      path: file.path,
      content: file.content || `Содержимое файла ${file.name}`,
      originalContent: file.originalContent || (file.isDiff ? file.originalContent || 'Старый код' : ''),
      isDiff: !!file.isDiff,
    };
  },
  async submitFinalReview(taskId: LegacyValue, payload: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');
    const filtered = (review.finalReviews || []).filter((item: LegacyValue) => item.reviewerId !== payload.reviewerId);

    filtered.push({
      id: Date.now(),
      ...payload,
    });

    review.finalReviews = filtered;
    reviewMockStore.set(Number(taskId), review);

    return clone(review);
  },
  async finishReview(taskId: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');
    review.status = 'COMPLETED';
    reviewMockStore.set(Number(taskId), review);

    await this.updateTask(taskId, {
      status: TASK_STATUS.DONE,
    });

    return clone(review);
  },
  async resubmitSolution(taskId: LegacyValue, payload: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');

    (review.history as LegacyValue[]).push({
      ...clone(review),
      isHistory: true,
    });

    review.status = 'WAITING';
    review.files = payload.files || [];
    review.finalReviews = [];
    reviewMockStore.set(Number(taskId), review);

    await this.updateTask(taskId, {
      status: TASK_STATUS.IN_REVIEW,
    });

    return clone(review);
  },
  async addReviewComment(taskId: LegacyValue, payload: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');

    const nextComment = {
      id: Date.now(),
      ...payload,
      replies: [],
      likes: 0,
      likedBy: [],
      dislikes: 0,
      dislikedBy: [],
      isClosed: false,
    };

    (review.comments as LegacyValue[]).push(nextComment);

    if (review.status === 'NEW' || review.status === 'WAITING') {
      review.status = 'IN_PROGRESS';
      const assigned = MOCK_ASSIGNED_REVIEWS.find((r: LegacyValue) => r.id === Number(taskId));
      if (assigned) assigned.status = 'IN_PROGRESS';
    }

    reviewMockStore.set(Number(taskId), review);

    return clone(review);
  },
  async replyToReviewComment(taskId: LegacyValue, commentId: LegacyValue, payload: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');

    const findComment = (comments: LegacyValue, id: LegacyValue): LegacyValue => {
      for (const c of comments) {
        if (c.id === id) return c;

        if (c.replies) {
          const found: LegacyValue = findComment(c.replies, id);
          if (found) return found;
        }
      }

      return null;
    };

    const parent = findComment(review.comments, commentId);

    if (parent) {
      (parent.replies as LegacyValue[]).push({
        id: Date.now(),
        ...payload,
        replies: [],
        likes: 0,
        likedBy: [],
        dislikes: 0,
        dislikedBy: [],
      });
    }

    reviewMockStore.set(Number(taskId), review);

    return clone(review);
  },
  async toggleCommentLike(
    taskId: LegacyValue,
    commentId: LegacyValue,
    userId: LegacyValue,
    isDislike: LegacyValue = false
  ) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');

    const findComment = (comments: LegacyValue, id: LegacyValue): LegacyValue => {
      for (const c of comments) {
        if (c.id === id) return c;

        if (c.replies) {
          const found: LegacyValue = findComment(c.replies, id);
          if (found) return found;
        }
      }

      return null;
    };

    const target = findComment(review.comments, commentId);

    if (target) {
      if (!Array.isArray(target.likedBy)) target.likedBy = [];
      if (!Array.isArray(target.dislikedBy)) target.dislikedBy = [];
      const list = isDislike ? target.dislikedBy : target.likedBy;
      const oppositeList = isDislike ? target.likedBy : target.dislikedBy;

      if (list.includes(userId)) {
        const idx = list.indexOf(userId);
        if (idx > -1) list.splice(idx, 1);
      } else {
        list.push(userId);
        const oppIdx = oppositeList.indexOf(userId);
        if (oppIdx > -1) oppositeList.splice(oppIdx, 1);
      }
    }

    reviewMockStore.set(Number(taskId), review);

    return clone(review);
  },
  async closeCommentThread(taskId: LegacyValue, commentId: LegacyValue, action: LegacyValue = 'close') {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');
    const target = review.comments.find((c: LegacyValue) => c.id === commentId);

    if (target) {
      const closing = action === 'close';
      target.isClosed = closing;
      if (!target.replies) target.replies = [];

      (target.replies as LegacyValue[]).push({
        id: Date.now(),
        text: closing ? '--Тред был закрыт--' : '--Тред был возобновлен--',
        authorId: 0,
        authorName: 'Система',
        authorRole: 'System',
        createdAt: new Date().toISOString(),
        likedBy: [],
        dislikedBy: [],
        replies: [],
      });
    }

    reviewMockStore.set(Number(taskId), review);

    return clone(review);
  },
  async deleteReviewComment(taskId: LegacyValue, commentId: LegacyValue) {
    const review = reviewMockStore.get(Number(taskId));
    if (!review) throw new Error('Review not found');

    const filterComment = (comments: LegacyValue, id: LegacyValue) => {
      const filtered = comments.filter((c: LegacyValue) => c.id !== id);

      filtered.forEach((c: LegacyValue) => {
        if (c.replies) {
          c.replies = filterComment(c.replies, id);
        }
      });

      return filtered;
    };

    review.comments = filterComment(review.comments, commentId);
    reviewMockStore.set(Number(taskId), review);

    return clone(review);
  },
  async reportComment(taskId: LegacyValue, commentId: LegacyValue, payload: LegacyValue) {
    void taskId;
    void commentId;
    void payload;

    return {
      success: true,
    };
  },
};

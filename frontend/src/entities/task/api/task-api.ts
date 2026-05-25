import {
  MOCK_PROJECTS,
  mockUsersById,
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIVACY,
  TASK_REVIEW_TYPE,
  TASK_STATUS,
  type EntityId,
  type Project,
  type ProjectMemberRole,
  type ProjectParticipant,
  type Task,
} from '@/entities/project/@x/task';
import { apiRequest, toBackendLocalDateTime } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

import { MOCK_TASKS } from './mocks';

interface BackendParticipantDto {
  id: number;
  login: string;
  email?: string;
  fullName?: string;
  avatar?: string | null;
  role?: string | null;
}

interface TaskPermissionsDto {
  viewerRole?: ProjectMemberRole;
  canViewTask?: boolean;
  canManageSettings?: boolean;
  canUploadSolution?: boolean;
  canFinishReview?: boolean;
}

interface BackendTaskDto {
  id: EntityId;
  projectId: EntityId;
  organizationId?: EntityId;
  solutionId?: EntityId;
  projectName?: string;
  isProjectPrivate?: boolean;
  aiReviewEnabled?: boolean;
  name?: string;
  description?: string;
  requirements?: string;
  evaluationCriteria?: string;
  status: Task['status'];
  deadline?: string;
  reviewType?: Task['reviewType'];
  assignees?: BackendParticipantDto[];
  reviewers?: BackendParticipantDto[];
  assigneeIds?: EntityId[];
  reviewerIds?: EntityId[];
  availableAssignees?: EntityId[];
  availableReviewers?: EntityId[];
  commentsCount?: number;
  hasSolution?: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: TaskPermissionsDto;
}

export type TaskPayload = Omit<
  Task,
  | 'id'
  | 'projectId'
  | 'organizationId'
  | 'solutionId'
  | 'projectName'
  | 'projectPrivacy'
  | 'assignees'
  | 'reviewers'
  | 'availableAssignees'
  | 'availableReviewers'
  | 'viewerRole'
  | 'isMock'
  | 'canManageSettings'
  | 'canViewTask'
  | 'canUploadSolution'
  | 'canFinishReview'
  | 'status'
> & { status?: Task['status'] };

export interface TaskMutationResult {
  accepted: boolean;
  taskId?: EntityId;
}

export interface DeletedTaskResult {
  deleted: boolean;
}

export interface ManualCodePayload {
  fileName: string;
  language: string;
  content: string;
}

export interface SubmitSolutionPayload {
  uploadType: 'MANUAL_TEXT';
  manualCode: ManualCodePayload;
  revealAuthorAfterReview?: boolean;
}

export interface SolutionMutationResult {
  id?: EntityId;
  status?: string;
}

interface StatusDto {
  isDeleted?: boolean;
  deleted?: boolean;
}

const clone = <T>(value: T): T => structuredClone(value);
const taskMockStore = new Map<string, Task[]>();
const getMockTaskKey = (projectId: EntityId): string => String(projectId);

const tasksByProject = MOCK_TASKS.reduce<Map<string, Task[]>>((store, task) => {
  const key = getMockTaskKey(task.projectId);
  store.set(key, [...(store.get(key) ?? []), task]);

  return store;
}, new Map<string, Task[]>());

const normalizeParticipantRole = (role?: string | null): ProjectMemberRole => {
  if (role === PROJECT_MEMBER_ROLE.OWNER) return PROJECT_MEMBER_ROLE.OWNER;
  if (role === PROJECT_MEMBER_ROLE.GUEST) return PROJECT_MEMBER_ROLE.GUEST;

  return PROJECT_MEMBER_ROLE.MEMBER;
};

const isEditableTaskStatus = (status: Task['status']): boolean =>
  status === TASK_STATUS.IN_PROGRESS || status === TASK_STATUS.REWORK;

const mapParticipant = (participant: BackendParticipantDto): ProjectParticipant => ({
  id: participant.id,
  login: participant.login,
  email: participant.email ?? '',
  fullName: participant.fullName ?? '',
  avatar: getImageUrl(participant.avatar),
  role: normalizeParticipantRole(participant.role),
});

const mapTaskFromBackend = (
  task: BackendTaskDto,
  viewerRole: ProjectMemberRole,
  participants: readonly ProjectParticipant[]
): Task => {
  const assignees = (task.assignees ?? []).map(mapParticipant);
  const reviewers = (task.reviewers ?? []).map(mapParticipant);

  return {
    id: task.id,
    projectId: task.projectId,
    projectName: task.projectName ?? '',
    name: task.name ?? '',
    description: task.description ?? '',
    requirements: task.requirements ?? '',
    evaluationCriteria: task.evaluationCriteria ?? '',
    status: task.status,
    deadline: task.deadline ?? '',
    reviewType: task.reviewType ?? TASK_REVIEW_TYPE.AI_ONLY,
    assignees,
    reviewers,
    assigneeIds: assignees.map((participant) => participant.id),
    reviewerIds: reviewers.map((participant) => participant.id),
    viewerRole,
    commentsCount: task.commentsCount ?? 0,
    hasSolution: Boolean(task.hasSolution),
    createdAt: task.createdAt ?? '',
    updatedAt: task.updatedAt ?? '',
    isMock: false,
    canManageSettings: Boolean(task.permissions?.canManageSettings ?? isEditableTaskStatus(task.status)),
    availableAssignees: clone([...participants]),
    availableReviewers: clone([...participants]),
  };
};

const resolveParticipants = (
  ids: readonly EntityId[] = [],
  participants: readonly ProjectParticipant[] = []
): ProjectParticipant[] => {
  const participantsById = new Map(participants.map((participant) => [Number(participant.id), participant]));

  return ids
    .map((id) => participantsById.get(Number(id)))
    .filter((participant): participant is ProjectParticipant => participant !== undefined)
    .map(mapParticipant);
};

const resolveAvailableParticipants = (
  ids: readonly EntityId[] = [],
  participants: readonly ProjectParticipant[] = []
): ProjectParticipant[] =>
  ids.length === 0 ? participants.map(mapParticipant) : resolveParticipants(ids, participants);

const mapTaskDetailsFromBackend = (
  task: BackendTaskDto,
  participants: readonly ProjectParticipant[],
  projectViewerRole: ProjectMemberRole
): Task => {
  const assigneeIds = task.assigneeIds ?? [];
  const reviewerIds = task.reviewerIds ?? [];
  const viewerRole = task.permissions?.viewerRole ?? projectViewerRole;

  return {
    id: task.id,
    projectId: task.projectId,
    ...(task.organizationId !== undefined ? { organizationId: task.organizationId } : {}),
    ...(task.solutionId !== undefined ? { solutionId: task.solutionId } : {}),
    projectName: task.projectName ?? '',
    projectPrivacy: task.isProjectPrivate ? PROJECT_PRIVACY.PRIVATE : PROJECT_PRIVACY.PUBLIC,
    aiReviewEnabled: Boolean(task.aiReviewEnabled),
    name: task.name ?? '',
    description: task.description ?? '',
    requirements: task.requirements ?? '',
    evaluationCriteria: task.evaluationCriteria ?? '',
    status: task.status,
    deadline: task.deadline ?? '',
    reviewType: task.reviewType ?? TASK_REVIEW_TYPE.AI_ONLY,
    assigneeIds,
    reviewerIds,
    assignees: resolveParticipants(assigneeIds, participants),
    reviewers: resolveParticipants(reviewerIds, participants),
    availableAssignees: resolveAvailableParticipants(task.availableAssignees, participants),
    availableReviewers: resolveAvailableParticipants(task.availableReviewers, participants),
    viewerRole,
    canViewTask: Boolean(task.permissions?.canViewTask ?? true),
    canManageSettings: Boolean(task.permissions?.canManageSettings ?? viewerRole === PROJECT_MEMBER_ROLE.OWNER),
    canUploadSolution: Boolean(task.permissions?.canUploadSolution ?? false),
    canFinishReview: Boolean(task.permissions?.canFinishReview ?? false),
    createdAt: task.createdAt ?? '',
    updatedAt: task.updatedAt ?? '',
    isMock: false,
  };
};

const createFallbackParticipant = (id: EntityId): ProjectParticipant => {
  const mockUser = mockUsersById.get(Number(id));

  return {
    id: Number(id),
    login: mockUser?.login ?? '',
    email: mockUser?.email ?? '',
    fullName: mockUser?.fullName ?? '',
    avatar: getImageUrl(mockUser?.avatar),
    role: PROJECT_MEMBER_ROLE.MEMBER,
  };
};

const normalizeTaskRecord = (task: Task): Task => ({
  ...clone(task),
  assigneeIds: [...(task.assigneeIds ?? [])],
  reviewerIds: [...(task.reviewerIds ?? [])],
  assignees: (task.assignees ?? []).map(mapParticipant),
  reviewers: (task.reviewers ?? []).map(mapParticipant),
  availableAssignees: (task.availableAssignees ?? []).map(mapParticipant),
  availableReviewers: (task.availableReviewers ?? []).map(mapParticipant),
});

const hydrateMockTask = (task: Task, project: Project): Task => {
  const participants = project.participants ?? [];
  const participantsById = new Map(participants.map((participant) => [Number(participant.id), participant]));

  const resolveParticipant = (id: EntityId): ProjectParticipant =>
    mapParticipant(participantsById.get(Number(id)) ?? mockUsersById.get(Number(id)) ?? createFallbackParticipant(id));

  return {
    ...normalizeTaskRecord(task),
    projectName: project.name,
    projectPrivacy: project.privacy,
    aiReviewEnabled: Boolean(project.aiReviewEnabled),
    assignees: (task.assigneeIds ?? []).map(resolveParticipant),
    reviewers: (task.reviewerIds ?? []).map(resolveParticipant),
    viewerRole: project.viewerRole ?? PROJECT_MEMBER_ROLE.GUEST,
    canManageSettings: isEditableTaskStatus(task.status),
    isMock: true,
    availableAssignees: clone(participants),
    availableReviewers: clone(participants),
  };
};

export const getProjectTaskSummaries = (
  projectId: EntityId,
  participants: readonly ProjectParticipant[] = [],
  viewerRole: ProjectMemberRole = PROJECT_MEMBER_ROLE.GUEST,
  project?: Project
): Task[] => {
  const key = getMockTaskKey(projectId);

  if (!taskMockStore.has(key)) {
    const initialTasks = tasksByProject.get(key) ?? [];

    const context: Project =
      project ??
      ({
        id: projectId,
        name: '',
        privacy: PROJECT_PRIVACY.PUBLIC,
        participants: [...participants],
        viewerRole,
      } satisfies Project);

    taskMockStore.set(
      key,
      initialTasks.map((task) => hydrateMockTask(task, context))
    );
  }

  return (taskMockStore.get(key) ?? []).map(normalizeTaskRecord);
};

export const mapProjectTaskSummaries = (
  tasks: BackendTaskDto[],
  projectViewerRole: ProjectMemberRole,
  participants: readonly ProjectParticipant[]
): Task[] => tasks.map((task) => mapTaskFromBackend(task, projectViewerRole, participants));

const isMockProjectId = (projectId: EntityId): boolean =>
  MOCK_PROJECTS.some((project) => Number(project.id) === Number(projectId));

const getMockProject = (projectId: EntityId): Project | null => {
  const project = MOCK_PROJECTS.find((item) => Number(item.id) === Number(projectId));

  return project
    ? {
        ...project,
        participants: project.participants.map(mapParticipant),
        viewerRole: project.viewerRole ?? PROJECT_MEMBER_ROLE.OWNER,
      }
    : null;
};

const getProjectUsers = async (projectId: EntityId): Promise<ProjectParticipant[]> => {
  const users = await apiRequest<BackendParticipantDto[]>({
    method: 'GET',
    url: `/api/v1/projects/${projectId}/participants`,
  });

  return users.map(mapParticipant);
};

const toManualSolutionFormData = (taskId: EntityId, payload: SubmitSolutionPayload): FormData => {
  const formData = new FormData();
  formData.append('taskId', String(taskId));
  formData.append('uploadType', payload.uploadType);
  formData.append('revealAuthorAfterReview', String(Boolean(payload.revealAuthorAfterReview)));
  formData.append('manualCode.fileName', payload.manualCode.fileName);
  formData.append('manualCode.language', payload.manualCode.language);
  formData.append('manualCode.content', payload.manualCode.content);

  return formData;
};

export const taskApi = {
  async getTaskById(projectId: EntityId, taskId: EntityId): Promise<Task> {
    if (isMockProjectId(projectId)) {
      const project = getMockProject(projectId);

      if (!project) {
        const error = new Error('Задача не найдена');
        error.status = 404;
        throw error;
      }

      const tasks = getProjectTaskSummaries(projectId, project.participants, project.viewerRole, project);
      const task = tasks.find((item) => Number(item.id) === Number(taskId));

      if (!task) {
        const error = new Error('Задача не найдена');
        error.status = 404;
        throw error;
      }

      return hydrateMockTask(task, project);
    }

    const task = await apiRequest<BackendTaskDto>({ method: 'GET', url: `/api/v1/tasks/${taskId}` });
    const actualProjectId = task.projectId ?? projectId;
    const participants = await getProjectUsers(actualProjectId).catch(() => []);

    const project = await apiRequest<{ viewerRole?: ProjectMemberRole }>({
      method: 'GET',
      url: `/api/v1/projects/${actualProjectId}`,
    }).catch(() => null);

    return mapTaskDetailsFromBackend(
      task,
      participants,
      project?.viewerRole ?? task.permissions?.viewerRole ?? PROJECT_MEMBER_ROLE.GUEST
    );
  },

  async createTask(projectId: EntityId, payload: TaskPayload): Promise<TaskMutationResult> {
    if (isMockProjectId(projectId)) {
      const project = getMockProject(projectId);

      if (!project) {
        throw new Error('Проект не найден');
      }

      const tasks = getProjectTaskSummaries(projectId, project.participants, project.viewerRole, project);

      const taskId =
        Math.max(0, ...MOCK_TASKS.map((task) => Number(task.id)), ...tasks.map((task) => Number(task.id))) + 1;

      const nextTask = hydrateMockTask(
        { id: taskId, projectId: Number(projectId), ...payload, status: payload.status ?? TASK_STATUS.IN_PROGRESS },
        project
      );

      taskMockStore.set(getMockTaskKey(projectId), [...tasks, nextTask]);

      return { accepted: true, taskId };
    }

    const data = await apiRequest<{ id?: EntityId }>({
      method: 'POST',
      url: '/api/v1/tasks',
      data: {
        ...payload,
        projectId: Number(projectId),
        ...(payload.deadline ? { deadline: toBackendLocalDateTime(payload.deadline) } : {}),
      },
    });

    return data.id === undefined ? { accepted: true } : { accepted: true, taskId: data.id };
  },

  async updateTask(taskId: EntityId, payload: Partial<TaskPayload>): Promise<Task> {
    for (const [key, tasks] of taskMockStore.entries()) {
      const index = tasks.findIndex((task) => Number(task.id) === Number(taskId));

      if (index >= 0) {
        const task = tasks[index];

        if (!task) {
          throw new Error('Задача не найдена');
        }

        const updatedTask: Task = { ...task, ...payload };
        const nextTasks = [...tasks];
        nextTasks[index] = updatedTask;
        taskMockStore.set(key, nextTasks);

        return clone(updatedTask);
      }
    }

    return apiRequest<Task>({
      method: 'PATCH',
      url: `/api/v1/tasks/${taskId}`,
      data: {
        ...payload,
        ...(payload.deadline !== undefined ? { deadline: toBackendLocalDateTime(payload.deadline) } : {}),
      },
    });
  },

  async deleteTask(taskId: EntityId): Promise<DeletedTaskResult> {
    for (const [key, tasks] of taskMockStore.entries()) {
      const nextTasks = tasks.filter((task) => Number(task.id) !== Number(taskId));

      if (nextTasks.length !== tasks.length) {
        taskMockStore.set(key, nextTasks);

        return { deleted: true };
      }
    }

    const result = await apiRequest<StatusDto>({ method: 'DELETE', url: `/api/v1/tasks/${taskId}` });

    return { deleted: Boolean(result.isDeleted ?? result.deleted ?? true) };
  },

  async submitSolution(taskId: EntityId, payload: SubmitSolutionPayload): Promise<SolutionMutationResult> {
    return apiRequest<SolutionMutationResult>({
      method: 'POST',
      url: '/api/v1/solutions',
      data: toManualSolutionFormData(taskId, payload),
    });
  },

  async resubmitSolution(taskId: EntityId, payload: SubmitSolutionPayload): Promise<SolutionMutationResult> {
    return apiRequest<SolutionMutationResult>({
      method: 'POST',
      url: '/api/v1/solutions/resubmit',
      data: toManualSolutionFormData(taskId, payload),
    });
  },

  async updateAuthorVisibility(
    solutionId: EntityId,
    revealAuthorAfterReview: boolean
  ): Promise<SolutionMutationResult> {
    return apiRequest<SolutionMutationResult>({
      method: 'PATCH',
      url: '/api/v1/solutions/author-visibility',
      data: { solutionId: Number(solutionId), revealAuthorAfterReview },
    });
  },

  async resendSolution(taskId: EntityId, reviewerIds: EntityId[]): Promise<SolutionMutationResult> {
    return apiRequest<SolutionMutationResult>({
      method: 'POST',
      url: '/api/v1/solutions/resend',
      data: { taskId: Number(taskId), reviewerIds },
    });
  },

  async finishReview(taskId: EntityId): Promise<SolutionMutationResult> {
    return apiRequest<SolutionMutationResult>({ method: 'POST', url: `/api/v1/tasks/${taskId}/done` });
  },
};

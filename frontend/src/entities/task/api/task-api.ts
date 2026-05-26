import {
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIVACY,
  TASK_REVIEW_TYPE,
  TASK_STATUS,
  type EntityId,
  type ProjectMemberRole,
  type ProjectParticipant,
  type Task,
} from '@/entities/project/@x/task';
import { apiRequest, toBackendLocalDateTime } from '@/shared/api';
import { getImageUrl } from '@/shared/lib';

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
  aiReviewEnabledAtCreation?: boolean;
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
  | 'aiReviewEnabled'
  | 'aiReviewEnabledAtCreation'
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
    aiReviewEnabledAtCreation: Boolean(task.aiReviewEnabledAtCreation),
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

export const mapProjectTaskSummaries = (
  tasks: BackendTaskDto[],
  projectViewerRole: ProjectMemberRole,
  participants: readonly ProjectParticipant[]
): Task[] => tasks.map((task) => mapTaskFromBackend(task, projectViewerRole, participants));

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

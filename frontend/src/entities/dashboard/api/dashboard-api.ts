import type { EntityId, TaskStatus } from '@/entities/project';
import type { ReviewStatus } from '@/entities/review';
import { apiRequest } from '@/shared/api';

export interface DashboardTaskDto {
  id: EntityId;
  projectId: EntityId;
  taskName?: string;
  projectName?: string;
  deadline?: string | null;
  status: TaskStatus;
}

export interface DashboardReviewDto {
  id?: EntityId;
  reviewId?: EntityId;
  taskId: EntityId;
  taskName?: string;
  projectId?: EntityId;
  project?: { id: EntityId; name: string };
  projectName?: string;
  uploadedAt?: string;
  responseDeadline?: string;
  deadline?: string;
  status: ReviewStatus;
}

export interface DashboardProjectDto {
  id: EntityId;
  name: string;
}

type ArrayPayload<T> = T[] | { content?: T[]; items?: T[]; data?: T[] };

const toArrayPayload = <T>(response: ArrayPayload<T>): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  return response.content ?? response.items ?? response.data ?? [];
};

export const dashboardApi = {
  async getDashboardTasks(): Promise<DashboardTaskDto[]> {
    const response = await apiRequest<ArrayPayload<DashboardTaskDto>>({
      method: 'GET',
      url: '/api/v1/dashboard/tasks',
    });

    return toArrayPayload(response);
  },
  async getDashboardReviews(): Promise<DashboardReviewDto[]> {
    const response = await apiRequest<ArrayPayload<DashboardReviewDto>>({
      method: 'GET',
      url: '/api/v1/dashboard/reviews',
    });

    return toArrayPayload(response);
  },
  async getDashboardProjects(): Promise<DashboardProjectDto[]> {
    const response = await apiRequest<ArrayPayload<DashboardProjectDto>>({
      method: 'GET',
      url: '/api/v1/dashboard/projects',
    });

    return toArrayPayload(response);
  },
};

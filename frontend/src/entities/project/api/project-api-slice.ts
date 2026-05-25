import { baseApi, toQueryResult } from '@/shared/api';

import type { EntityId, Project } from '../model/types';
import {
  projectsApi,
  type CreateProjectPayload,
  type DeletedResult,
  type LeftResult,
  type ProjectDashboardParams,
  type ProjectIdentifierResult,
  type ProjectSearchParams,
  type ProjectSearchResult,
  type ProjectsDashboard,
  type UpdateProjectPayload,
} from './projects-api';

const projectListTag = { type: 'Project' as const, id: 'LIST' };
const dashboardTag = { type: 'Dashboard' as const, id: 'PROJECTS' };
const organizationListTag = { type: 'Organization' as const, id: 'LIST' };

interface SearchProjectsArg {
  viewerId: EntityId;
  params?: ProjectSearchParams;
}

interface UpdateProjectArg {
  projectId: EntityId;
  payload: UpdateProjectPayload;
}

export const projectApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsDashboard: build.query<ProjectsDashboard, ProjectDashboardParams | void>({
      queryFn: (params) => toQueryResult(() => projectsApi.getProjectsDashboard(params ?? {})),
      providesTags: [dashboardTag, projectListTag, organizationListTag],
    }),
    getProjectById: build.query<Project, EntityId>({
      queryFn: (projectId) => toQueryResult(() => projectsApi.getProjectById(projectId)),
      providesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
        { type: 'Task', id: `PROJECT-${projectId}` },
      ],
    }),
    searchProjectsForJoin: build.query<ProjectSearchResult, SearchProjectsArg>({
      queryFn: ({ viewerId, params = {} }) => toQueryResult(() => projectsApi.searchProjectsForJoin(viewerId, params)),
      providesTags: [projectListTag],
    }),
    createProject: build.mutation<ProjectIdentifierResult, CreateProjectPayload>({
      queryFn: (payload) => toQueryResult(() => projectsApi.createProject(payload)),
      invalidatesTags: [dashboardTag, projectListTag],
    }),
    updateProject: build.mutation<Project, UpdateProjectArg>({
      queryFn: ({ projectId, payload }) => toQueryResult(() => projectsApi.updateProject(projectId, payload)),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        dashboardTag,
        projectListTag,
      ],
    }),
    deleteProject: build.mutation<DeletedResult, EntityId>({
      queryFn: (projectId) => toQueryResult(() => projectsApi.deleteProject(projectId)),
      invalidatesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
        dashboardTag,
        projectListTag,
      ],
    }),
    leaveProject: build.mutation<LeftResult, EntityId>({
      queryFn: (projectId) => toQueryResult(() => projectsApi.leaveProject(projectId)),
      invalidatesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
        dashboardTag,
        projectListTag,
      ],
    }),
    joinPublicProject: build.mutation<ProjectIdentifierResult, EntityId>({
      queryFn: (projectId) => toQueryResult(() => projectsApi.joinPublicProject(projectId)),
      invalidatesTags: [dashboardTag, projectListTag],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useGetProjectsDashboardQuery,
  useJoinPublicProjectMutation,
  useLeaveProjectMutation,
  useLazySearchProjectsForJoinQuery,
  useUpdateProjectMutation,
} = projectApiSlice;

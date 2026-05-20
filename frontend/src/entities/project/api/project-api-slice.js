import { baseApi, toQueryResult } from '@/shared/api';
import { projectsApi } from './projects-api';

const projectListTag = { type: 'Project', id: 'LIST' };
const dashboardTag = { type: 'Dashboard', id: 'PROJECTS' };
const organizationListTag = { type: 'Organization', id: 'LIST' };
const reviewListTag = { type: 'Review', id: 'LIST' };

export const projectApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsDashboard: build.query({
      queryFn: (params = {}) => toQueryResult(() => projectsApi.getProjectsDashboard(params)),
      providesTags: [dashboardTag, projectListTag, organizationListTag]
    }),
    getProjectById: build.query({
      queryFn: (projectId) => toQueryResult(() => projectsApi.getProjectById(projectId)),
      providesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
        { type: 'Task', id: `PROJECT-${projectId}` }
      ]
    }),
    getTaskById: build.query({
      queryFn: ({ projectId, taskId }) => toQueryResult(() => projectsApi.getTaskById(projectId, taskId)),
      providesTags: (_result, _error, { projectId, taskId }) => [
        { type: 'Task', id: taskId },
        { type: 'Project', id: projectId }
      ]
    }),
    getOrganizationById: build.query({
      queryFn: (organizationId) => toQueryResult(() => projectsApi.getOrganizationById(organizationId)),
      providesTags: (_result, _error, organizationId) => [{ type: 'Organization', id: organizationId }]
    }),
    getOrganizationProjects: build.query({
      queryFn: ({ organizationId, params = {} }) =>
        toQueryResult(() => projectsApi.getOrganizationProjects(organizationId, params)),
      providesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        { type: 'Project', id: `ORGANIZATION-${organizationId}` }
      ]
    }),
    getMyOrganizations: build.query({
      queryFn: (viewerId) => toQueryResult(() => projectsApi.getMyOrganizations(viewerId)),
      providesTags: [organizationListTag]
    }),
    searchProjectsForJoin: build.query({
      queryFn: ({ viewerId, params = {} }) => toQueryResult(() => projectsApi.searchProjectsForJoin(viewerId, params)),
      providesTags: [projectListTag]
    }),
    searchOrganizations: build.query({
      queryFn: ({ viewerId, params = {} }) => toQueryResult(() => projectsApi.searchOrganizations(viewerId, params)),
      providesTags: [organizationListTag]
    }),
    getReviewById: build.query({
      queryFn: (reviewId) => toQueryResult(() => projectsApi.getReviewById(reviewId)),
      providesTags: (_result, _error, reviewId) => [{ type: 'Review', id: reviewId }]
    }),
    getReviewByTaskId: build.query({
      queryFn: (taskId) => toQueryResult(() => projectsApi.getReviewByTaskId(taskId)),
      providesTags: (_result, _error, taskId) => [
        { type: 'Review', id: `TASK-${taskId}` },
        { type: 'Task', id: taskId }
      ]
    }),
    getReviewFileContent: build.query({
      queryFn: ({ reviewIdOrTaskId, filePath }) =>
        toQueryResult(() => projectsApi.getReviewFileContent(reviewIdOrTaskId, filePath)),
      providesTags: (_result, _error, { reviewIdOrTaskId, filePath }) => [
        { type: 'Review', id: `FILE-${reviewIdOrTaskId}-${filePath}` }
      ]
    }),
    createProject: build.mutation({
      queryFn: (payload) => toQueryResult(() => projectsApi.createProject(payload)),
      invalidatesTags: [dashboardTag, projectListTag]
    }),
    updateProject: build.mutation({
      queryFn: ({ projectId, payload }) => toQueryResult(() => projectsApi.updateProject(projectId, payload)),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        dashboardTag,
        projectListTag
      ]
    }),
    deleteProject: build.mutation({
      queryFn: (projectId) => toQueryResult(() => projectsApi.deleteProject(projectId)),
      invalidatesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
        dashboardTag,
        projectListTag
      ]
    }),
    leaveProject: build.mutation({
      queryFn: (projectId) => toQueryResult(() => projectsApi.leaveProject(projectId)),
      invalidatesTags: (_result, _error, projectId) => [
        { type: 'Project', id: projectId },
        dashboardTag,
        projectListTag
      ]
    }),
    createTask: build.mutation({
      queryFn: ({ projectId, payload }) => toQueryResult(() => projectsApi.createTask(projectId, payload)),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: 'Project', id: projectId },
        { type: 'Task', id: `PROJECT-${projectId}` },
        dashboardTag
      ]
    }),
    updateTask: build.mutation({
      queryFn: ({ taskId, payload }) => toQueryResult(() => projectsApi.updateTask(taskId, payload)),
      invalidatesTags: (_result, _error, { taskId, projectId }) => [
        { type: 'Task', id: taskId },
        ...(projectId ? [{ type: 'Project', id: projectId }, { type: 'Task', id: `PROJECT-${projectId}` }] : []),
        reviewListTag
      ]
    }),
    deleteTask: build.mutation({
      queryFn: (arg) => {
        const taskId = typeof arg === 'object' ? arg.taskId : arg;
        return toQueryResult(() => projectsApi.deleteTask(taskId));
      },
      invalidatesTags: (_result, _error, arg) => {
        const taskId = typeof arg === 'object' ? arg.taskId : arg;
        const projectId = typeof arg === 'object' ? arg.projectId : undefined;

        return [
          { type: 'Task', id: taskId },
          ...(projectId ? [{ type: 'Project', id: projectId }, { type: 'Task', id: `PROJECT-${projectId}` }] : []),
          projectListTag,
          dashboardTag
        ];
      }
    }),
    createOrganization: build.mutation({
      queryFn: (payload) => toQueryResult(() => projectsApi.createOrganization(payload)),
      invalidatesTags: [dashboardTag, organizationListTag]
    }),
    updateOrganization: build.mutation({
      queryFn: ({ organizationId, payload }) => toQueryResult(() => projectsApi.updateOrganization(organizationId, payload)),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        dashboardTag,
        organizationListTag
      ]
    }),
    deleteOrganization: build.mutation({
      queryFn: (organizationId) => toQueryResult(() => projectsApi.deleteOrganization(organizationId)),
      invalidatesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
        dashboardTag,
        organizationListTag
      ]
    }),
    leaveOrganization: build.mutation({
      queryFn: (organizationId) => toQueryResult(() => projectsApi.leaveOrganization(organizationId)),
      invalidatesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
        dashboardTag,
        organizationListTag
      ]
    }),
    approveOrganizationJoinRequest: build.mutation({
      queryFn: ({ organizationId, userId }) =>
        toQueryResult(() => projectsApi.approveOrganizationJoinRequest(organizationId, userId)),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        organizationListTag
      ]
    }),
    rejectOrganizationJoinRequest: build.mutation({
      queryFn: ({ organizationId, userId }) =>
        toQueryResult(() => projectsApi.rejectOrganizationJoinRequest(organizationId, userId)),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        organizationListTag
      ]
    }),
    joinPublicProject: build.mutation({
      queryFn: (projectId) => toQueryResult(() => projectsApi.joinPublicProject(projectId)),
      invalidatesTags: [dashboardTag, projectListTag]
    }),
    requestOrganizationAccess: build.mutation({
      queryFn: (organizationId) => toQueryResult(() => projectsApi.requestOrganizationAccess(organizationId)),
      invalidatesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
        organizationListTag
      ]
    }),
    invalidateReview: build.mutation({
      queryFn: async () => ({ data: null }),
      invalidatesTags: [reviewListTag]
    })
  })
});

export const {
  useApproveOrganizationJoinRequestMutation,
  useCreateOrganizationMutation,
  useCreateProjectMutation,
  useCreateTaskMutation,
  useDeleteOrganizationMutation,
  useDeleteProjectMutation,
  useDeleteTaskMutation,
  useGetMyOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useGetOrganizationProjectsQuery,
  useGetProjectByIdQuery,
  useGetProjectsDashboardQuery,
  useGetReviewByIdQuery,
  useGetReviewByTaskIdQuery,
  useGetReviewFileContentQuery,
  useGetTaskByIdQuery,
  useJoinPublicProjectMutation,
  useLeaveOrganizationMutation,
  useLeaveProjectMutation,
  useLazySearchOrganizationsQuery,
  useLazySearchProjectsForJoinQuery,
  useRejectOrganizationJoinRequestMutation,
  useRequestOrganizationAccessMutation,
  useUpdateOrganizationMutation,
  useUpdateProjectMutation,
  useUpdateTaskMutation
} = projectApiSlice;

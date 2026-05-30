import { baseApi, toQueryResult } from '@/shared/api';
import { dashboardApi } from './dashboard-api';
import type { DashboardProjectDto, DashboardReviewDto, DashboardTaskDto } from './dashboard-api';

const dashboardTag = {
  type: 'Dashboard' as const,
  id: 'PROJECTS',
};

const projectListTag = {
  type: 'Project' as const,
  id: 'LIST',
};

const reviewListTag = {
  type: 'Review' as const,
  id: 'LIST',
};

export const dashboardApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardTasks: build.query<DashboardTaskDto[], void>({
      queryFn: () => toQueryResult(() => dashboardApi.getDashboardTasks()),
      providesTags: [dashboardTag],
    }),
    getDashboardReviews: build.query<DashboardReviewDto[], void>({
      queryFn: () => toQueryResult(() => dashboardApi.getDashboardReviews()),
      providesTags: [dashboardTag, reviewListTag],
    }),
    getDashboardProjects: build.query<DashboardProjectDto[], void>({
      queryFn: () => toQueryResult(() => dashboardApi.getDashboardProjects()),
      providesTags: [dashboardTag, projectListTag],
    }),
  }),
});

export const { useGetDashboardProjectsQuery, useGetDashboardReviewsQuery, useGetDashboardTasksQuery } =
  dashboardApiSlice;

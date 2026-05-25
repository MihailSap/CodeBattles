import type { EntityId } from '@/entities/project/@x/organization';
import { baseApi, toQueryResult } from '@/shared/api';

import type { OrganizationCreateFormValues, OrganizationSettingsFormValues } from '../lib/validation';
import type { Organization, OrganizationDetails } from '../model/types';
import {
  organizationApi,
  type OrganizationMutationResult,
  type OrganizationProjectsResult,
  type OrganizationsResult,
  type SearchParams,
} from './organization-api';

const dashboardTag = { type: 'Dashboard' as const, id: 'PROJECTS' };
const organizationListTag = { type: 'Organization' as const, id: 'LIST' };

interface OrganizationSearchArg {
  viewerId: EntityId;
  params?: SearchParams;
}

interface OrganizationProjectsArg {
  organizationId: EntityId;
  params?: SearchParams;
}

interface UpdateOrganizationArg {
  organizationId: EntityId;
  payload: OrganizationSettingsFormValues;
}

interface OrganizationUserArg {
  organizationId: EntityId;
  userId: EntityId;
}

export const organizationApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOrganizationById: build.query<OrganizationDetails, EntityId>({
      queryFn: (organizationId) => toQueryResult(() => organizationApi.getOrganizationById(organizationId)),
      providesTags: (_result, _error, organizationId) => [{ type: 'Organization', id: organizationId }],
    }),
    getOrganizationProjects: build.query<OrganizationProjectsResult, OrganizationProjectsArg>({
      queryFn: ({ organizationId, params = {} }) =>
        toQueryResult(() => organizationApi.getOrganizationProjects(organizationId, params)),
      providesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        { type: 'Project', id: `ORGANIZATION-${organizationId}` },
      ],
    }),
    getMyOrganizations: build.query<Organization[], EntityId>({
      queryFn: (viewerId) => toQueryResult(() => organizationApi.getMyOrganizations(viewerId)),
      providesTags: [organizationListTag],
    }),
    searchOrganizations: build.query<OrganizationsResult, OrganizationSearchArg>({
      queryFn: ({ viewerId, params = {} }) =>
        toQueryResult(() => organizationApi.searchOrganizations(viewerId, params)),
      providesTags: [organizationListTag],
    }),
    createOrganization: build.mutation<OrganizationMutationResult, OrganizationCreateFormValues>({
      queryFn: (payload) => toQueryResult(() => organizationApi.createOrganization(payload)),
      invalidatesTags: [dashboardTag, organizationListTag],
    }),
    updateOrganization: build.mutation<OrganizationDetails, UpdateOrganizationArg>({
      queryFn: ({ organizationId, payload }) =>
        toQueryResult(() => organizationApi.updateOrganization(organizationId, payload)),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        dashboardTag,
        organizationListTag,
      ],
    }),
    deleteOrganization: build.mutation<{ deleted: boolean }, EntityId>({
      queryFn: (organizationId) => toQueryResult(() => organizationApi.deleteOrganization(organizationId)),
      invalidatesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
        dashboardTag,
        organizationListTag,
      ],
    }),
    leaveOrganization: build.mutation<{ left: boolean }, EntityId>({
      queryFn: (organizationId) => toQueryResult(() => organizationApi.leaveOrganization(organizationId)),
      invalidatesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
        dashboardTag,
        organizationListTag,
      ],
    }),
    approveOrganizationJoinRequest: build.mutation<OrganizationMutationResult, OrganizationUserArg>({
      queryFn: ({ organizationId, userId }) =>
        toQueryResult(() => organizationApi.approveOrganizationJoinRequest(organizationId, userId)),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        organizationListTag,
      ],
    }),
    rejectOrganizationJoinRequest: build.mutation<OrganizationMutationResult, OrganizationUserArg>({
      queryFn: ({ organizationId, userId }) =>
        toQueryResult(() => organizationApi.rejectOrganizationJoinRequest(organizationId, userId)),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: 'Organization', id: organizationId },
        organizationListTag,
      ],
    }),
    requestOrganizationAccess: build.mutation<OrganizationMutationResult, EntityId>({
      queryFn: (organizationId) => toQueryResult(() => organizationApi.requestOrganizationAccess(organizationId)),
      invalidatesTags: (_result, _error, organizationId) => [
        { type: 'Organization', id: organizationId },
        organizationListTag,
      ],
    }),
  }),
});

export const {
  useApproveOrganizationJoinRequestMutation,
  useCreateOrganizationMutation,
  useDeleteOrganizationMutation,
  useGetMyOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useGetOrganizationProjectsQuery,
  useLazySearchOrganizationsQuery,
  useLeaveOrganizationMutation,
  useRejectOrganizationJoinRequestMutation,
  useRequestOrganizationAccessMutation,
  useUpdateOrganizationMutation,
} = organizationApiSlice;

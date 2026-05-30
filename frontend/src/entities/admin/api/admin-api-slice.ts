import { baseApi, toQueryResult } from '@/shared/api';

import { adminApi } from './admin-api';
import type {
  AdminCommentComplaint,
  AdminEvent,
  AdminEventsFilter,
  AdminSystemSettings,
  ResolveAdminComplaintRequest,
  ResolveAdminComplaintResponse,
  UpdateAdminAiSystemPromptRequest,
  UpdateAdminReviewDeadlineRequest,
} from '../model/types';

const adminComplaintsListTag = {
  type: 'AdminComplaint' as const,
  id: 'LIST',
};

const adminEventsListTag = {
  type: 'AdminEvent' as const,
  id: 'LIST',
};

const adminSettingsTag = {
  type: 'AdminSettings' as const,
  id: 'CURRENT',
};

export const adminApiSlice = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAdminComplaints: build.query<AdminCommentComplaint[], void>({
      queryFn: () => toQueryResult(() => adminApi.getComplaints()),
      providesTags: [adminComplaintsListTag],
    }),
    resolveAdminComplaint: build.mutation<
      ResolveAdminComplaintResponse,
      { complaintId: number; payload: ResolveAdminComplaintRequest }
    >({
      queryFn: ({ complaintId, payload }) => toQueryResult(() => adminApi.resolveComplaint(complaintId, payload)),
      invalidatesTags: [adminComplaintsListTag],
    }),
    getAdminSystemSettings: build.query<AdminSystemSettings, void>({
      queryFn: () => toQueryResult(() => adminApi.getSystemSettings()),
      providesTags: [adminSettingsTag],
    }),
    updateAdminReviewDeadlineDays: build.mutation<AdminSystemSettings, UpdateAdminReviewDeadlineRequest>({
      queryFn: (payload) => toQueryResult(() => adminApi.updateReviewDeadlineDays(payload)),
      invalidatesTags: [adminSettingsTag],
    }),
    updateAdminAiSystemPrompt: build.mutation<AdminSystemSettings, UpdateAdminAiSystemPromptRequest>({
      queryFn: (payload) => toQueryResult(() => adminApi.updateAiSystemPrompt(payload)),
      invalidatesTags: [adminSettingsTag],
    }),
    getAdminEvents: build.query<AdminEvent[], AdminEventsFilter | undefined>({
      queryFn: (params = {}) => toQueryResult(() => adminApi.getEvents(params)),
      providesTags: [adminEventsListTag],
    }),
  }),
});
export const {
  useGetAdminComplaintsQuery,
  useGetAdminEventsQuery,
  useGetAdminSystemSettingsQuery,
  useResolveAdminComplaintMutation,
  useUpdateAdminAiSystemPromptMutation,
  useUpdateAdminReviewDeadlineDaysMutation,
} = adminApiSlice;

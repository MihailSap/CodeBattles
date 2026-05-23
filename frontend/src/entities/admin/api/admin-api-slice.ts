import { baseApi, toQueryResult } from '@/shared/api';
import { adminApi } from './admin-api';

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
    getAdminComplaints: build.query({
      queryFn: (params: LegacyValue = {}) => toQueryResult(() => adminApi.getComplaints(params)),
      providesTags: [adminComplaintsListTag],
    }),
    resolveAdminComplaint: build.mutation({
      queryFn: ({ complaintId, payload }: LegacyValue) =>
        toQueryResult(() => adminApi.resolveComplaint(complaintId, payload)),
      invalidatesTags: [adminComplaintsListTag, adminEventsListTag],
    }),
    getAdminSystemSettings: build.query({
      queryFn: () => toQueryResult(() => adminApi.getSystemSettings()),
      providesTags: [adminSettingsTag],
    }),
    updateAdminReviewDeadlineDays: build.mutation({
      queryFn: (payload: LegacyValue) => toQueryResult(() => adminApi.updateReviewDeadlineDays(payload)),
      invalidatesTags: [adminSettingsTag, adminEventsListTag],
    }),
    updateAdminAiSystemPrompt: build.mutation({
      queryFn: (payload: LegacyValue) => toQueryResult(() => adminApi.updateAiSystemPrompt(payload)),
      invalidatesTags: [adminSettingsTag, adminEventsListTag],
    }),
    getAdminEvents: build.query({
      queryFn: (params: LegacyValue = {}) => toQueryResult(() => adminApi.getEvents(params)),
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

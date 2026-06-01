import { apiRequest } from '@/shared/api';

import type {
  AdminCommentComplaint,
  AdminEventsPage,
  AdminEventsFilter,
  AdminSystemSettings,
  ResolveAdminComplaintRequest,
  ResolveAdminComplaintResponse,
  UpdateAdminAiSystemPromptRequest,
  UpdateAdminReviewDeadlineRequest,
} from '../model/types';

export const adminApi = {
  getComplaints(): Promise<AdminCommentComplaint[]> {
    return apiRequest<AdminCommentComplaint[]>({
      method: 'GET',
      url: '/api/v1/admin/complaints/comments',
    });
  },
  resolveComplaint(complaintId: number, payload: ResolveAdminComplaintRequest): Promise<ResolveAdminComplaintResponse> {
    return apiRequest<ResolveAdminComplaintResponse>({
      method: 'POST',
      url: `/api/v1/admin/complaints/comments/${complaintId}/decision`,
      data: payload,
    });
  },
  getSystemSettings(): Promise<AdminSystemSettings> {
    return apiRequest<AdminSystemSettings>({
      method: 'GET',
      url: '/api/v1/admin/system-settings',
    });
  },
  updateReviewDeadlineDays(payload: UpdateAdminReviewDeadlineRequest): Promise<AdminSystemSettings> {
    return apiRequest<AdminSystemSettings>({
      method: 'PATCH',
      url: '/api/v1/admin/system-settings/review-deadline',
      data: payload,
    });
  },
  updateAiSystemPrompt(payload: UpdateAdminAiSystemPromptRequest): Promise<AdminSystemSettings> {
    return apiRequest<AdminSystemSettings>({
      method: 'PATCH',
      url: '/api/v1/admin/system-settings/ai-system-prompt',
      data: payload,
    });
  },
  getEvents(params: AdminEventsFilter = {}): Promise<AdminEventsPage> {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));
    if (params.type) searchParams.set('type', params.type);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);

    const query = searchParams.toString();

    return apiRequest<AdminEventsPage>({
      method: 'GET',
      url: `/api/v1/admin/events${query ? `?${query}` : ''}`,
    });
  },
};

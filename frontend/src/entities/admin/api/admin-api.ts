import { apiRequest } from '@/shared/api';

import { ADMIN_EVENT_TYPE } from '../model/constants';
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

const ADMIN_ACTOR = {
  id: 1,
  login: 'admin_anna',
  fullName: 'Анна Админова',
};

const MOCK_ADMIN_EVENTS: AdminEvent[] = [
  {
    id: 1,
    type: ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_APPROVED,
    createdAt: '2026-05-21T06:20:00.000Z',
    actor: ADMIN_ACTOR,
    targetUser: {
      id: 23,
      login: 'max_refactor',
      fullName: 'Максим Орлов',
    },
    target: {
      title: 'Review #452: REST API для турниров',
      url: '/reviews/452',
    },
    reason: 'Оскорбительное содержание',
    consequence: 'Комментарий удален, начислен штраф -100 баллов',
  },
  {
    id: 2,
    type: ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_REJECTED,
    createdAt: '2026-05-20T08:20:00.000Z',
    actor: ADMIN_ACTOR,
    targetUser: {
      id: 54,
      login: 'redux_doc',
      fullName: 'Антон Ковалев',
    },
    target: {
      title: 'Задача #126: RTK Query cache',
      url: '/projects/5/tasks/126',
    },
    reason: 'Спам',
  },
  {
    id: 3,
    type: ADMIN_EVENT_TYPE.SYSTEM_REVIEW_DEADLINE_CHANGED,
    createdAt: '2026-05-18T06:20:00.000Z',
    actor: ADMIN_ACTOR,
    previousValue: '10 дней',
    newValue: '14 дней',
  },
  {
    id: 4,
    type: ADMIN_EVENT_TYPE.SYSTEM_AI_PROMPT_CHANGED,
    createdAt: '2026-05-14T07:20:00.000Z',
    actor: ADMIN_ACTOR,
    previousValue: 'Ты AI-ревьюер...',
    newValue: 'Ты строгий, но конструктивный AI-ревьюер...',
  },
];

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
  async getEvents(params: AdminEventsFilter = {}): Promise<AdminEvent[]> {
    const dateFrom = params.dateFrom ? new Date(`${params.dateFrom}T00:00:00`).getTime() : null;
    const dateTo = params.dateTo ? new Date(`${params.dateTo}T23:59:59`).getTime() : null;

    return MOCK_ADMIN_EVENTS.filter((event) => {
      const eventTime = new Date(event.createdAt).getTime();
      const typeMatches = params.type ? event.type === params.type : true;
      const fromMatches = dateFrom === null ? true : eventTime >= dateFrom;
      const toMatches = dateTo === null ? true : eventTime <= dateTo;

      return typeMatches && fromMatches && toMatches;
    });
  },
};

import type { ADMIN_COMPLAINT_DECISION, ADMIN_COMPLAINT_REASON, ADMIN_EVENT_TYPE } from './constants';

export type AdminComplaintDecision = (typeof ADMIN_COMPLAINT_DECISION)[keyof typeof ADMIN_COMPLAINT_DECISION];
export type AdminComplaintReason = (typeof ADMIN_COMPLAINT_REASON)[keyof typeof ADMIN_COMPLAINT_REASON];
export type AdminEventType = (typeof ADMIN_EVENT_TYPE)[keyof typeof ADMIN_EVENT_TYPE];

export interface AdminUserBrief {
  id: number;
  login: string;
  fullName: string;
}

export interface AdminComplaintTarget {
  kind: string;
  title: string;
  url?: string;
  projectId: number | null;
  taskId: number | null;
  reviewId: number | null;
}

export interface AdminCommentComplaint {
  id: number;
  commentId: number;
  commentText: string;
  commentAuthor: AdminUserBrief;
  target: AdminComplaintTarget;
  reason: AdminComplaintReason;
  reportedBy: AdminUserBrief;
  createdAt: string;
}

export interface AdminAiFeedbackStats {
  totalLikes: number;
  totalDislikes: number;
  periodDays: number;
}

export interface AdminSystemSettings {
  reviewDeadlineDays: number;
  aiSystemPrompt: string;
  aiFeedbackStats: AdminAiFeedbackStats;
}

export interface UpdateAdminReviewDeadlineRequest {
  reviewDeadlineDays: number;
}

export interface UpdateAdminAiSystemPromptRequest {
  aiSystemPrompt: string;
}

export interface ResolveAdminComplaintRequest {
  decision: AdminComplaintDecision;
}

export interface ResolveAdminComplaintResponse {
  complaintId: number;
  decision: AdminComplaintDecision;
  consequence: string;
  removedCommentId: number | null;
  penaltyPoints: number | null;
}

export interface AdminEvent {
  id: number;
  type: AdminEventType;
  createdAt: string;
  actor: AdminUserBrief;
  targetUser?: AdminUserBrief;
  target?: Partial<AdminComplaintTarget>;
  reason?: string;
  consequence?: string;
  details?: string;
  scope?: {
    name: string;
    url: string;
  };
  previousValue?: string;
  newValue?: string;
}

export interface AdminEventsFilter {
  type?: AdminEventType;
  dateFrom?: string;
  dateTo?: string;
}

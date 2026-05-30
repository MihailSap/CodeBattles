import type { NotificationCompletionAction, NotificationTargetKind, NotificationType } from './constants';

export interface NotificationTarget {
  kind: NotificationTargetKind;
  organizationId?: number | string;
  projectId?: number | string;
  taskId?: number | string;
  taskName?: string;
  reviewId?: number | string;
  userId?: number | string;
}

export interface NotificationCompletion {
  action: NotificationCompletionAction;
  target: NotificationTarget;
}

export interface AppNotification {
  id: number | string;
  type: NotificationType;
  title: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  deadline?: string;
  target: NotificationTarget | null;
  completion: NotificationCompletion | null;
  threadReplyCount?: number;
}

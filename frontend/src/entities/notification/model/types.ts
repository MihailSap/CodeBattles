export interface NotificationTarget {
  kind: string;
  organizationId?: number | string;
  projectId?: number | string;
  taskId?: number | string;
  taskName?: string;
  reviewId?: number | string;
  userId?: number | string;
}

export interface NotificationCompletion {
  action: string;
  target: NotificationTarget;
}

export interface AppNotification {
  id: number | string;
  type: string;
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

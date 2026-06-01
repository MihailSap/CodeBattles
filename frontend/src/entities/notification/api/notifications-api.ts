import { httpClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config/api';
import { tokenStorage } from '@/shared/lib';
import { NOTIFICATION_COMPLETION_ACTION, NOTIFICATION_TARGET_KIND, NOTIFICATION_TYPE } from '../model/constants';
import type { AppNotification, NotificationCompletion, NotificationTarget } from '../model/types';

type NotificationEvent =
  | { type: 'notification.upserted'; notification: AppNotification }
  | { type: 'notification.deleted'; notificationId: number | string }
  | { type: 'notification.unknown'; raw: unknown };

type NotificationListener = (event: NotificationEvent) => void;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isIdentifier = (value: unknown): value is number | string =>
  typeof value === 'number' || typeof value === 'string';

const isNotificationType = (value: unknown): value is AppNotification['type'] =>
  Object.values(NOTIFICATION_TYPE).some((type) => type === value);

const isTargetKind = (value: unknown): value is NotificationTarget['kind'] =>
  Object.values(NOTIFICATION_TARGET_KIND).some((kind) => kind === value);

const isCompletionAction = (value: unknown): value is NotificationCompletion['action'] =>
  Object.values(NOTIFICATION_COMPLETION_ACTION).some((action) => action === value);

const parseTarget = (value: unknown): NotificationTarget | null => {
  if (!isRecord(value) || !isTargetKind(value['kind'])) {
    return null;
  }

  return {
    kind: value['kind'],
    ...(isIdentifier(value['organizationId']) ? { organizationId: value['organizationId'] } : {}),
    ...(isIdentifier(value['projectId']) ? { projectId: value['projectId'] } : {}),
    ...(isIdentifier(value['taskId']) ? { taskId: value['taskId'] } : {}),
    ...(typeof value['taskName'] === 'string' ? { taskName: value['taskName'] } : {}),
    ...(isIdentifier(value['reviewId']) ? { reviewId: value['reviewId'] } : {}),
    ...(isIdentifier(value['userId']) ? { userId: value['userId'] } : {}),
  };
};

const parseCompletion = (value: unknown): NotificationCompletion | null => {
  if (!isRecord(value) || !isCompletionAction(value['action'])) {
    return null;
  }

  const target = parseTarget(value['target']);

  return target ? { action: value['action'], target } : null;
};

const parseNotification = (value: unknown): AppNotification | null => {
  if (
    !isRecord(value) ||
    !isIdentifier(value['id']) ||
    !isNotificationType(value['type']) ||
    typeof value['title'] !== 'string' ||
    typeof value['text'] !== 'string' ||
    typeof value['isRead'] !== 'boolean' ||
    typeof value['createdAt'] !== 'string'
  ) {
    return null;
  }

  return {
    id: value['id'],
    type: value['type'],
    title: value['title'],
    text: value['text'],
    isRead: value['isRead'],
    createdAt: value['createdAt'],
    target: parseTarget(value['target']),
    completion: parseCompletion(value['completion']),
    ...(typeof value['expiresAt'] === 'string' ? { expiresAt: value['expiresAt'] } : {}),
    ...(typeof value['deadline'] === 'string' ? { deadline: value['deadline'] } : {}),
    ...(typeof value['threadReplyCount'] === 'number' ? { threadReplyCount: value['threadReplyCount'] } : {}),
  };
};

const parseEvent = (value: unknown): NotificationEvent => {
  if (!isRecord(value)) {
    return { type: 'notification.unknown', raw: value };
  }

  if (value['type'] === 'notification.deleted' && isIdentifier(value['notificationId'])) {
    return { type: 'notification.deleted', notificationId: value['notificationId'] };
  }

  if (value['type'] === 'notification.upserted') {
    const notification = parseNotification(value['notification']);

    if (notification) {
      return { type: 'notification.upserted', notification };
    }
  }

  return { type: 'notification.unknown', raw: value };
};

const getNotificationsWsUrl = (): string => {
  const explicitUrl = import.meta.env['VITE_NOTIFICATIONS_WS_URL'];

  if (explicitUrl) {
    return explicitUrl;
  }

  return API_BASE_URL.replace(/^http/i, 'ws').replace(/\/$/, '') + '/api/v1/notifications/stream';
};

const subscribeBackendNotifications = (listener: NotificationListener): (() => void) => {
  const wsUrl = getNotificationsWsUrl();
  const accessToken = tokenStorage.getAccessToken();
  const url = accessToken ? `${wsUrl}?accessToken=${encodeURIComponent(accessToken)}` : wsUrl;
  const socket = new WebSocket(url);

  socket.addEventListener('message', (event: MessageEvent<string>) => {
    try {
      listener(parseEvent(JSON.parse(event.data)));
    } catch {
      listener({
        type: 'notification.unknown',
        raw: event.data,
      });
    }
  });

  return () => {
    socket.close();
  };
};

export const notificationsApi = {
  async getNotifications(): Promise<AppNotification[]> {
    const response = await httpClient.get<unknown>('/api/v1/notifications');

    return Array.isArray(response.data)
      ? response.data
          .map(parseNotification)
          .filter((notification): notification is AppNotification => notification !== null)
      : [];
  },
  async markAllRead(): Promise<{ updatedCount: number }> {
    const response = await httpClient.patch<unknown>('/api/v1/notifications/read-all');

    if (isRecord(response.data) && typeof response.data['updatedCount'] === 'number') {
      return { updatedCount: response.data['updatedCount'] };
    }

    return { updatedCount: 0 };
  },
  async deleteNotification(notificationId: number | string): Promise<{ id: number | string }> {
    await httpClient.delete(`/api/v1/notifications/${notificationId}`);

    return {
      id: notificationId,
    };
  },
  async completeNotification(payload: NotificationCompletion): Promise<{ deletedIds: (number | string)[] }> {
    const response = await httpClient.post<unknown>('/api/v1/notifications/complete', payload);

    const deletedIds =
      isRecord(response.data) && Array.isArray(response.data['deletedIds'])
        ? response.data['deletedIds'].filter(isIdentifier)
        : [];

    return { deletedIds };
  },
  subscribe(listener: NotificationListener): () => void {
    return subscribeBackendNotifications(listener);
  },
};

import { httpClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config/api';
import { tokenStorage } from '@/shared/lib';
import { isNotificationExpired } from '../lib/notification-utils';
import { NOTIFICATION_TYPE } from '../model/constants';
import { MOCK_NOTIFICATIONS, MOCK_REALTIME_NOTIFICATIONS } from './mock-notifications';
import type { AppNotification, NotificationCompletion, NotificationTarget } from '../model/types';

type NotificationEvent =
  | { type: 'notification.upserted'; notification: AppNotification }
  | { type: 'notification.deleted'; notificationId: number | string }
  | { type: 'notification.unknown'; raw: unknown };

type NotificationListener = (event: NotificationEvent) => void;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const mockListeners = new Set<NotificationListener>();

const mockStore = new Map<number | string, AppNotification>(
  MOCK_NOTIFICATIONS.map((notification) => [notification.id, clone(notification as AppNotification)])
);

const MOCK_REALTIME_NOTIFICATIONS_LIMIT = 1;
let mockRealtimeStarted = false;

const getActiveMockNotifications = (): AppNotification[] =>
  [...mockStore.values()]
    .filter((notification) => !isNotificationExpired(notification))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(clone);

const notifyMockListeners = (event: NotificationEvent): void => {
  mockListeners.forEach((listener) => listener(clone(event)));
};

const getTargetId = (target: NotificationTarget = { kind: '' }): number | string | undefined =>
  target.reviewId || target.taskId || target.organizationId || target.userId || target.kind;

const isSameTarget = (
  left: NotificationTarget = { kind: '' },
  right: NotificationTarget = { kind: '' }
): boolean => {
  if (!left || !right || left.kind !== right.kind) {
    return false;
  }

  if (left.userId && right.userId && Number(left.userId) !== Number(right.userId)) {
    return false;
  }

  return String(getTargetId(left)) === String(getTargetId(right));
};

const isCompletionMatch = (notification: AppNotification, payload: NotificationCompletion): boolean => {
  if (!notification.completion || notification.completion.action !== payload.action) {
    return false;
  }

  return isSameTarget(notification.completion.target, payload.target);
};

const upsertMockNotification = (incomingNotification: AppNotification): AppNotification => {
  const notification: AppNotification = {
    ...incomingNotification,
    isRead: Boolean(incomingNotification.isRead),
  };

  if (notification.type === NOTIFICATION_TYPE.THREAD_REPLY) {
    const groupedNotification = [...mockStore.values()].find(
      (currentNotification) =>
        currentNotification.type === NOTIFICATION_TYPE.THREAD_REPLY &&
        isSameTarget(currentNotification.target ?? undefined, notification.target ?? undefined)
    );

    if (groupedNotification) {
      const threadReplyCount = (groupedNotification.threadReplyCount || 1) + (notification.threadReplyCount || 1);
      const taskName = groupedNotification.target?.taskName || notification.target?.taskName || 'задаче';

      const mergedNotification: AppNotification = {
        ...groupedNotification,
        createdAt: notification.createdAt,
        isRead: false,
        threadReplyCount,
        text:
          threadReplyCount > 1
            ? `Было получено несколько ответов на ваши комментарии в задаче ${taskName}.`
            : notification.text,
        ...(notification.expiresAt ? { expiresAt: notification.expiresAt } : {}),
      };

      mockStore.set(groupedNotification.id, mergedNotification);

      return mergedNotification;
    }
  }

  mockStore.set(notification.id, notification);

  return notification;
};

const startMockRealtime = (): void => {
  if (mockRealtimeStarted) {
    return;
  }

  mockRealtimeStarted = true;

  MOCK_REALTIME_NOTIFICATIONS.slice(0, MOCK_REALTIME_NOTIFICATIONS_LIMIT).forEach((notification, index) => {
    window.setTimeout(() => {
      const storedNotification = upsertMockNotification({
        ...(clone(notification) as AppNotification),
        createdAt: new Date().toISOString(),
      });

      notifyMockListeners({
        type: 'notification.upserted',
        notification: storedNotification,
      });
    }, 1000 + index * 6000);
  });
};

const getNotificationsWsUrl = (): string => {
  const explicitUrl = import.meta.env.VITE_NOTIFICATIONS_WS_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  return API_BASE_URL.replace(/^http/i, 'ws').replace(/\/$/, '') + '/api/v1/notifications/stream';
};

const isMockMode = (): boolean => !import.meta.env.VITE_NOTIFICATIONS_WS_URL;

const subscribeMockNotifications = (listener: NotificationListener): (() => void) => {
  mockListeners.add(listener);
  startMockRealtime();

  return () => {
    mockListeners.delete(listener);
  };
};

const subscribeBackendNotifications = (listener: NotificationListener): (() => void) => {
  const wsUrl = getNotificationsWsUrl();
  const accessToken = tokenStorage.getAccessToken();
  const url = accessToken ? `${wsUrl}?accessToken=${encodeURIComponent(accessToken)}` : wsUrl;
  const socket = new WebSocket(url);

  socket.addEventListener('message', (event: MessageEvent<string>) => {
    try {
      listener(JSON.parse(event.data) as NotificationEvent);
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
    if (isMockMode()) {
      return getActiveMockNotifications();
    }

    const response = await httpClient.get('/api/v1/notifications');

    return response.data || [];
  },
  async markAllRead(): Promise<{ updatedCount: number }> {
    if (isMockMode()) {
      mockStore.forEach((notification, id) => {
        mockStore.set(id, {
          ...notification,
          isRead: true,
        });
      });

      return {
        updatedCount: mockStore.size,
      };
    }

    const response = await httpClient.patch('/api/v1/notifications/read-all');

    return response.data;
  },
  async deleteNotification(notificationId: number | string): Promise<{ id: number | string }> {
    if (isMockMode()) {
      mockStore.delete(notificationId);

      return {
        id: notificationId,
      };
    }

    await httpClient.delete(`/api/v1/notifications/${notificationId}`);

    return {
      id: notificationId,
    };
  },
  async completeNotification(payload: NotificationCompletion): Promise<{ deletedIds: (number | string)[] }> {
    if (isMockMode()) {
      const deletedIds: (number | string)[] = [];

      mockStore.forEach((notification, id) => {
        if (isCompletionMatch(notification, payload)) {
          mockStore.delete(id);
          deletedIds.push(id);
        }
      });

      return {
        deletedIds,
      };
    }

    const response = await httpClient.post('/api/v1/notifications/complete', payload);

    return (
      response.data || {
        deletedIds: [],
      }
    );
  },
  subscribe(listener: NotificationListener): () => void {
    if (isMockMode()) {
      return subscribeMockNotifications(listener);
    }

    return subscribeBackendNotifications(listener);
  },
};

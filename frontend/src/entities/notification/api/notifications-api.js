import { httpClient } from '@/shared/api';
import { API_BASE_URL } from '@/shared/config/api';
import { tokenStorage } from '@/shared/lib';
import { isNotificationExpired } from '../lib/notification-utils';
import { NOTIFICATION_TYPE } from '../model/constants';
import { MOCK_NOTIFICATIONS, MOCK_REALTIME_NOTIFICATIONS } from './mock-notifications';

const clone = (value) => JSON.parse(JSON.stringify(value));
const mockListeners = new Set();
const mockStore = new Map(MOCK_NOTIFICATIONS.map((notification) => [notification.id, clone(notification)]));
const MOCK_REALTIME_NOTIFICATIONS_LIMIT = 1;
let mockRealtimeStarted = false;

const getActiveMockNotifications = () =>
  [...mockStore.values()]
    .filter((notification) => !isNotificationExpired(notification))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map(clone);

const notifyMockListeners = (event) => {
  mockListeners.forEach((listener) => listener(clone(event)));
};

const getTargetId = (target = {}) =>
  target.reviewId || target.taskId || target.organizationId || target.userId || target.kind;

const isSameTarget = (left = {}, right = {}) => {
  if (!left || !right || left.kind !== right.kind) {
    return false;
  }

  if (left.userId && right.userId && Number(left.userId) !== Number(right.userId)) {
    return false;
  }

  return String(getTargetId(left)) === String(getTargetId(right));
};

const isCompletionMatch = (notification, payload) => {
  if (!notification.completion || notification.completion.action !== payload.action) {
    return false;
  }

  return isSameTarget(notification.completion.target, payload.target);
};

const upsertMockNotification = (incomingNotification) => {
  const notification = {
    ...incomingNotification,
    isRead: Boolean(incomingNotification.isRead),
  };

  if (notification.type === NOTIFICATION_TYPE.THREAD_REPLY) {
    const groupedNotification = [...mockStore.values()].find(
      (currentNotification) =>
        currentNotification.type === NOTIFICATION_TYPE.THREAD_REPLY &&
        isSameTarget(currentNotification.target, notification.target)
    );

    if (groupedNotification) {
      const threadReplyCount = (groupedNotification.threadReplyCount || 1) + (notification.threadReplyCount || 1);
      const taskName = groupedNotification.target?.taskName || notification.target?.taskName || 'задаче';
      const mergedNotification = {
        ...groupedNotification,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt,
        isRead: false,
        threadReplyCount,
        text:
          threadReplyCount > 1
            ? `Было получено несколько ответов на ваши комментарии в задаче ${taskName}.`
            : notification.text,
      };

      mockStore.set(groupedNotification.id, mergedNotification);
      return mergedNotification;
    }
  }

  mockStore.set(notification.id, notification);
  return notification;
};

const startMockRealtime = () => {
  if (mockRealtimeStarted) {
    return;
  }

  mockRealtimeStarted = true;

  MOCK_REALTIME_NOTIFICATIONS.slice(0, MOCK_REALTIME_NOTIFICATIONS_LIMIT).forEach((notification, index) => {
    window.setTimeout(
      () => {
        const storedNotification = upsertMockNotification({
          ...clone(notification),
          createdAt: new Date().toISOString(),
        });

        notifyMockListeners({
          type: 'notification.upserted',
          notification: storedNotification,
        });
      },
      1000 + index * 6000
    );
  });
};

const getNotificationsWsUrl = () => {
  const explicitUrl = import.meta.env.VITE_NOTIFICATIONS_WS_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  return API_BASE_URL.replace(/^http/i, 'ws').replace(/\/$/, '') + '/api/v1/notifications/stream';
};

const isMockMode = () => !import.meta.env.VITE_NOTIFICATIONS_WS_URL;

const subscribeMockNotifications = (listener) => {
  mockListeners.add(listener);
  startMockRealtime();

  return () => {
    mockListeners.delete(listener);
  };
};

const subscribeBackendNotifications = (listener) => {
  const wsUrl = getNotificationsWsUrl();
  const accessToken = tokenStorage.getAccessToken();
  const url = accessToken ? `${wsUrl}?accessToken=${encodeURIComponent(accessToken)}` : wsUrl;
  const socket = new WebSocket(url);

  socket.addEventListener('message', (event) => {
    try {
      listener(JSON.parse(event.data));
    } catch {
      listener({ type: 'notification.unknown', raw: event.data });
    }
  });

  return () => {
    socket.close();
  };
};

export const notificationsApi = {
  async getNotifications() {
    if (isMockMode()) {
      return getActiveMockNotifications();
    }

    const response = await httpClient.get('/api/v1/notifications');
    return response.data || [];
  },

  async markAllRead() {
    if (isMockMode()) {
      mockStore.forEach((notification, id) => {
        mockStore.set(id, { ...notification, isRead: true });
      });

      return { updatedCount: mockStore.size };
    }

    const response = await httpClient.patch('/api/v1/notifications/read-all');
    return response.data;
  },

  async deleteNotification(notificationId) {
    if (isMockMode()) {
      mockStore.delete(notificationId);
      return { id: notificationId };
    }

    await httpClient.delete(`/api/v1/notifications/${notificationId}`);
    return { id: notificationId };
  },

  async completeNotification(payload) {
    if (isMockMode()) {
      const deletedIds = [];

      mockStore.forEach((notification, id) => {
        if (isCompletionMatch(notification, payload)) {
          mockStore.delete(id);
          deletedIds.push(id);
        }
      });

      return { deletedIds };
    }

    const response = await httpClient.post('/api/v1/notifications/complete', payload);
    return response.data || { deletedIds: [] };
  },

  subscribe(listener) {
    if (isMockMode()) {
      return subscribeMockNotifications(listener);
    }

    return subscribeBackendNotifications(listener);
  },
};

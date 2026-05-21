import { ROUTES } from '@/shared/config/routes';
import {
  NOTIFICATION_COMPLETION_ACTION,
  NOTIFICATION_TARGET_KIND,
  NOTIFICATION_TTL_DAYS,
  NOTIFICATION_TYPE,
} from '../model/constants';
const MS_IN_DAY = 24 * 60 * 60 * 1000;
export const addDays = (date, days) => new Date(date.getTime() + days * MS_IN_DAY);

export const getNotificationExpiresAt = ({ type, createdAt, deadline }) => {
  const createdDate = new Date(createdAt);
  const defaultExpiresAt = addDays(createdDate, NOTIFICATION_TTL_DAYS[type] || 3);

  if (![NOTIFICATION_TYPE.TASK_ASSIGNED, NOTIFICATION_TYPE.REVIEW_AVAILABLE].includes(type) || !deadline) {
    return defaultExpiresAt.toISOString();
  }

  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime())) {
    return defaultExpiresAt.toISOString();
  }

  return new Date(Math.min(defaultExpiresAt.getTime(), deadlineDate.getTime())).toISOString();
};

export const isNotificationExpired = (notification, now = Date.now()) => {
  const expiresAt = new Date(notification.expiresAt).getTime();

  return Number.isFinite(expiresAt) && expiresAt <= now;
};

export const formatNotificationTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Сейчас';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'Сейчас';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} ч назад`;
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatNotificationDeadline = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'не указан';
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getNotificationRoute = (notification) => {
  const target = notification.target;

  if (!target) {
    return null;
  }

  if (target.kind === NOTIFICATION_TARGET_KIND.ORGANIZATION && target.organizationId) {
    return ROUTES.organizationById.replace(':organizationId', target.organizationId);
  }

  if (target.kind === NOTIFICATION_TARGET_KIND.TASK && target.projectId && target.taskId) {
    return ROUTES.projectTaskById.replace(':projectId', target.projectId).replace(':taskId', target.taskId);
  }

  if (target.kind === NOTIFICATION_TARGET_KIND.REVIEW && target.reviewId) {
    return ROUTES.reviewById.replace(':reviewId', target.reviewId);
  }

  if (target.kind === NOTIFICATION_TARGET_KIND.LEADERBOARD) {
    return ROUTES.leaderboard;
  }

  if (target.kind === NOTIFICATION_TARGET_KIND.PROFILE) {
    return ROUTES.profile;
  }

  return null;
};

export const getNotificationCompletionPayloadsForPath = (pathname) => {
  const payloads = [];
  const organizationMatch = pathname.match(/^\/organizations\/([^/]+)$/);
  const taskMatch = pathname.match(/^\/projects\/([^/]+)\/tasks\/([^/]+)$/);
  const reviewMatch = pathname.match(/^\/reviews\/([^/]+)$/);

  if (organizationMatch) {
    payloads.push({
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_ORGANIZATION,
      target: {
        kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
        organizationId: Number(organizationMatch[1]),
      },
    });
  }

  if (taskMatch) {
    payloads.push({
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_TASK,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: Number(taskMatch[1]),
        taskId: Number(taskMatch[2]),
      },
    });
  }

  if (reviewMatch) {
    payloads.push({
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_REVIEW,
      target: {
        kind: NOTIFICATION_TARGET_KIND.REVIEW,
        reviewId: Number(reviewMatch[1]),
      },
    });
  }

  if (pathname === ROUTES.leaderboard) {
    payloads.push({
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_LEADERBOARD,
      target: {
        kind: NOTIFICATION_TARGET_KIND.LEADERBOARD,
      },
    });
  }

  if (pathname === ROUTES.profile) {
    payloads.push({
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_PROFILE,
      target: {
        kind: NOTIFICATION_TARGET_KIND.PROFILE,
      },
    });
  }

  return payloads;
};

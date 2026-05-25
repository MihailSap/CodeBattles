import { NOTIFICATION_COMPLETION_ACTION, NOTIFICATION_TARGET_KIND, NOTIFICATION_TYPE } from '../model/constants';
import { formatNotificationDeadline, getNotificationExpiresAt } from '../lib/notification-utils';
import type { AppNotification } from '../model/types';

const makeDate = (minutesFromNow: number): string => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);

  return date.toISOString();
};

type MockNotificationInput = Omit<AppNotification, 'isRead' | 'createdAt' | 'expiresAt'> & {
  isRead?: boolean;
  createdAt?: string;
  deadline?: string;
};

const createNotification = (notification: MockNotificationInput): AppNotification => {
  const createdAt = notification.createdAt ?? new Date().toISOString();

  return {
    ...notification,
    isRead: Boolean(notification.isRead),
    createdAt,
    expiresAt: getNotificationExpiresAt({
      ...notification,
      createdAt,
    }),
  };
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  createNotification({
    id: 'mock-org-approved-300',
    type: NOTIFICATION_TYPE.ORGANIZATION_JOIN_APPROVED,
    title: 'Принятие в организацию',
    text: 'Вы были приняты в организацию CodeBattles Team.',
    isRead: true,
    createdAt: makeDate(-8),
    target: {
      kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
      organizationId: 300,
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_ORGANIZATION,
      target: {
        kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
        organizationId: 300,
      },
    },
  }),
  createNotification({
    id: 'mock-org-rejected-400',
    type: NOTIFICATION_TYPE.ORGANIZATION_JOIN_REJECTED,
    title: 'Отказ во вступлении',
    text: 'Ваш запрос на вступление в организацию DeepMind Corp был отклонен.',
    createdAt: makeDate(-34),
    target: null,
    completion: null,
  }),
  createNotification({
    id: 'mock-org-request-300-42',
    type: NOTIFICATION_TYPE.ORGANIZATION_JOIN_REQUEST,
    title: 'Запрос на вступление',
    text: 'Поступил запрос на вступление в организацию CodeBattles Team.',
    createdAt: makeDate(-48),
    target: {
      kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
      organizationId: 300,
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.RESOLVE_ORGANIZATION_JOIN_REQUEST,
      target: {
        kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
        organizationId: 300,
        userId: 42,
      },
    },
  }),
  createNotification({
    id: 'mock-task-assigned-9901',
    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    title: 'Новая задача',
    text: `Вы назначены исполнителем на задачу в проекте Personal Architecture Notes. Дедлайн сдачи: ${formatNotificationDeadline(makeDate(7200))}.`,
    isRead: true,
    createdAt: makeDate(-72),
    deadline: makeDate(7200),
    target: {
      kind: NOTIFICATION_TARGET_KIND.TASK,
      projectId: 9999,
      taskId: 9901,
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_TASK_SOLUTION,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 9999,
        taskId: 9901,
      },
    },
  }),
  createNotification({
    id: 'mock-task-completed-owner-9806',
    type: NOTIFICATION_TYPE.TASK_COMPLETED_OWNER,
    title: 'Задача завершена',
    text: 'Задача Написать юнит тесты была завершена.',
    createdAt: makeDate(-250),
    target: {
      kind: NOTIFICATION_TARGET_KIND.TASK,
      projectId: 6666,
      taskId: 9806,
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_TASK,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 6666,
        taskId: 9806,
      },
    },
  }),
  createNotification({
    id: 'mock-achievement-1',
    type: NOTIFICATION_TYPE.ACHIEVEMENT_RECEIVED,
    title: 'Новое достижение',
    text: 'Получено достижение Первая кровь!',
    createdAt: makeDate(-300),
    target: {
      kind: NOTIFICATION_TARGET_KIND.PROFILE,
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_PROFILE,
      target: {
        kind: NOTIFICATION_TARGET_KIND.PROFILE,
      },
    },
  }),
];
export const MOCK_REALTIME_NOTIFICATIONS: AppNotification[] = [];

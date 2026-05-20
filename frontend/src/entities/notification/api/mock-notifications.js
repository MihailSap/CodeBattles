import {
  NOTIFICATION_COMPLETION_ACTION,
  NOTIFICATION_TARGET_KIND,
  NOTIFICATION_TYPE
} from '../model/constants';
import { formatNotificationDeadline, getNotificationExpiresAt } from '../lib/notification-utils';

const makeDate = (minutesFromNow) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);
  return date.toISOString();
};

const createNotification = (notification) => {
  const createdAt = notification.createdAt || new Date().toISOString();

  return {
    ...notification,
    isRead: Boolean(notification.isRead),
    createdAt,
    expiresAt: getNotificationExpiresAt({ ...notification, createdAt })
  };
};

export const MOCK_NOTIFICATIONS = [
  createNotification({
    id: 'mock-org-approved-300',
    type: NOTIFICATION_TYPE.ORGANIZATION_JOIN_APPROVED,
    title: 'Принятие в организацию',
    text: 'Вы были приняты в организацию CodeBattles Team.',
    isRead: true,
    createdAt: makeDate(-8),
    target: {
      kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
      organizationId: 300
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_ORGANIZATION,
      target: {
        kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
        organizationId: 300
      }
    }
  }),
  createNotification({
    id: 'mock-org-rejected-400',
    type: NOTIFICATION_TYPE.ORGANIZATION_JOIN_REJECTED,
    title: 'Отказ во вступлении',
    text: 'Ваш запрос на вступление в организацию DeepMind Corp был отклонен.',
    createdAt: makeDate(-34),
    target: null,
    completion: null
  }),
  createNotification({
    id: 'mock-org-request-300-42',
    type: NOTIFICATION_TYPE.ORGANIZATION_JOIN_REQUEST,
    title: 'Запрос на вступление',
    text: 'Поступил запрос на вступление в организацию CodeBattles Team.',
    createdAt: makeDate(-48),
    target: {
      kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
      organizationId: 300
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.RESOLVE_ORGANIZATION_JOIN_REQUEST,
      target: {
        kind: NOTIFICATION_TARGET_KIND.ORGANIZATION,
        organizationId: 300,
        userId: 42
      }
    }
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
      taskId: 9901
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_TASK_SOLUTION,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 9999,
        taskId: 9901
      }
    }
  }),
  createNotification({
    id: 'mock-review-available-201',
    type: NOTIFICATION_TYPE.REVIEW_AVAILABLE,
    title: 'Новое ревью',
    text: `Доступно новое решение на ревью. Дедлайн ревью: ${formatNotificationDeadline(makeDate(4320))}.`,
    createdAt: makeDate(-95),
    deadline: makeDate(4320),
    target: {
      kind: NOTIFICATION_TARGET_KIND.REVIEW,
      reviewId: 201,
      taskId: 9801
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_REVIEW_RESULT,
      target: {
        kind: NOTIFICATION_TARGET_KIND.REVIEW,
        reviewId: 201,
        taskId: 9801
      }
    }
  }),
  createNotification({
    id: 'mock-review-approved-9904',
    type: NOTIFICATION_TYPE.REVIEW_APPROVED_BY_ALL,
    title: 'Решение одобрено',
    text: 'Ваше решение одобрили все ревьюеры. Вы можете посмотреть комментарии и принять результат проверки.',
    createdAt: makeDate(-130),
    target: {
      kind: NOTIFICATION_TARGET_KIND.TASK,
      projectId: 9999,
      taskId: 9904
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.ACCEPT_REVIEW_RESULT,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 9999,
        taskId: 9904
      }
    }
  }),
  createNotification({
    id: 'mock-review-rework-9903',
    type: NOTIFICATION_TYPE.REVIEW_REWORK_REQUIRED,
    title: 'Нужны правки',
    text: 'Ваше решение оценили все ревьюеры. Необходимо внести правки.',
    createdAt: makeDate(-180),
    target: {
      kind: NOTIFICATION_TARGET_KIND.TASK,
      projectId: 9999,
      taskId: 9903
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_TASK,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 9999,
        taskId: 9903
      }
    }
  }),
  createNotification({
    id: 'mock-thread-task-9903',
    type: NOTIFICATION_TYPE.THREAD_REPLY,
    title: 'Ответ в треде',
    text: 'Было получено несколько ответов на ваши комментарии в задаче Разработать Architecture Diagram Canvas.',
    isRead: true,
    createdAt: makeDate(-26),
    threadReplyCount: 3,
    target: {
      kind: NOTIFICATION_TARGET_KIND.TASK,
      projectId: 9999,
      taskId: 9903,
      taskName: 'Разработать Architecture Diagram Canvas'
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_TASK,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 9999,
        taskId: 9903
      }
    }
  }),
  createNotification({
    id: 'mock-task-completed-reviewer-9803',
    type: NOTIFICATION_TYPE.TASK_COMPLETED_REVIEWER,
    title: 'Задача завершена',
    text: 'Задача Интеграция Sentry была завершена. Баллы за ревью доступны на странице Лидерборда.',
    createdAt: makeDate(-210),
    target: {
      kind: NOTIFICATION_TARGET_KIND.LEADERBOARD
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_LEADERBOARD,
      target: { kind: NOTIFICATION_TARGET_KIND.LEADERBOARD }
    }
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
      taskId: 9806
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_TASK,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 6666,
        taskId: 9806
      }
    }
  }),
  createNotification({
    id: 'mock-achievement-1',
    type: NOTIFICATION_TYPE.ACHIEVEMENT_RECEIVED,
    title: 'Новое достижение',
    text: 'Получено достижение Первая кровь!',
    createdAt: makeDate(-300),
    target: {
      kind: NOTIFICATION_TARGET_KIND.PROFILE
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_PROFILE,
      target: { kind: NOTIFICATION_TARGET_KIND.PROFILE }
    }
  })
];

export const MOCK_REALTIME_NOTIFICATIONS = [
  createNotification({
    id: 'mock-rt-review-204',
    type: NOTIFICATION_TYPE.REVIEW_AVAILABLE,
    title: 'Новое ревью',
    text: `Доступно новое решение на ревью. Дедлайн ревью: ${formatNotificationDeadline(makeDate(1440))}.`,
    createdAt: makeDate(0),
    deadline: makeDate(1440),
    target: {
      kind: NOTIFICATION_TARGET_KIND.REVIEW,
      reviewId: 204,
      taskId: 9804
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.SUBMIT_REVIEW_RESULT,
      target: {
        kind: NOTIFICATION_TARGET_KIND.REVIEW,
        reviewId: 204,
        taskId: 9804
      }
    }
  }),
  createNotification({
    id: 'mock-rt-thread-9903-1',
    type: NOTIFICATION_TYPE.THREAD_REPLY,
    title: 'Ответ в треде',
    text: 'Был получен ответ на ваш комментарий в задаче Разработать Architecture Diagram Canvas.',
    createdAt: makeDate(0),
    threadReplyCount: 1,
    target: {
      kind: NOTIFICATION_TARGET_KIND.TASK,
      projectId: 9999,
      taskId: 9903,
      taskName: 'Разработать Architecture Diagram Canvas'
    },
    completion: {
      action: NOTIFICATION_COMPLETION_ACTION.OPEN_TASK,
      target: {
        kind: NOTIFICATION_TARGET_KIND.TASK,
        projectId: 9999,
        taskId: 9903
      }
    }
  })
];

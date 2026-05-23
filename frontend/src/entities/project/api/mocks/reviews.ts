import { MOCK_LARGE_FILE_TREE, MOCK_LARGE_CODE, MOCK_LARGE_COMMENTS, MOCK_REWORK_HISTORY_COMMENTS } from './content';

const REVIEW_STATUS = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

const makeDate = (daysFromNow: LegacyValue, hour: LegacyValue, minute: LegacyValue) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
};

const COMMON_FILES = JSON.parse(JSON.stringify(MOCK_LARGE_FILE_TREE));

const injectCode = (nodes: LegacyValue) => {
  for (const node of nodes) {
    if (node.name === 'ArchitectureDiagram.jsx') {
      node.content = MOCK_LARGE_CODE;
    }

    if (node.children) injectCode(node.children);
  }
};

injectCode(COMMON_FILES);
const DIFF_FILES = JSON.parse(JSON.stringify(COMMON_FILES));

DIFF_FILES.push({
  id: 'diff-file-1',
  name: 'AuthService.js',
  path: 'src/services/AuthService.js',
  isDirectory: false,
  isDiff: true,
  originalContent: `export const login = (credentials) => {
  return fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }).then(res => res.json());
};`,
  content: `export const login = async (credentials) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  return response.json();
};`,
});

export const MOCK_REVIEWS_STORE = new Map([
  [
    9902,
    {
      id: 101,
      taskId: 9902,
      status: REVIEW_STATUS.NEW,
      uploadedAt: makeDate(-1, 9, 0),
      deadline: makeDate(3, 18, 0),
      files: COMMON_FILES,
      comments: [],
      finalReviews: [],
      history: [],
      aiEvaluation: null,
      aiReviewEvaluation: null,
    },
  ],
  [
    9903,
    {
      id: 102,
      taskId: 9903,
      status: REVIEW_STATUS.IN_PROGRESS,
      uploadedAt: makeDate(-2, 14, 0),
      deadline: makeDate(4, 12, 0),
      files: COMMON_FILES,
      comments: MOCK_LARGE_COMMENTS.filter((c: LegacyValue) => !(c as LegacyValue).isResolved),
      finalReviews: [
        {
          id: 201,
          reviewerId: 12,
          reviewerName: 'Романов Александр Сергеевич',
          architecture: 3,
          readability: 4,
          testability: 2,
          scalability: 3,
          comment: 'Оптимизируй селекторы и убери O(N^2) рендер.',
          verdict: 'REWORK',
        },
        {
          id: 202,
          reviewerId: 14,
          reviewerName: 'Петрова Алина Олеговна',
          architecture: 4,
          readability: 3,
          testability: 3,
          scalability: 3,
          comment: 'Согласна с Александром, требуется оптимизация графа.',
          verdict: 'REWORK',
        },
      ],
      history: [
        {
          id: 401,
          taskId: 9903,
          status: 'REWORK',
          uploadedAt: makeDate(-5, 10, 0),
          files: COMMON_FILES,
          comments: MOCK_REWORK_HISTORY_COMMENTS,
          finalReviews: [
            {
              id: 203,
              reviewerId: 14,
              reviewerName: 'Петрова Алина Олеговна',
              architecture: 2,
              readability: 3,
              testability: 1,
              scalability: 2,
              comment: 'Лодаш тут лишний.',
              verdict: 'REWORK',
            },
          ],
          isHistory: true,
        },
      ],
      aiEvaluation: {
        qualityScore: 3.8,
        cyclomaticComplexity: 'C (Удовлетворительно)',
        solidViolations: {
          count: 2,
          severity: 'Средняя',
        },
        overallComment:
          'Код имеет среднюю сложность. Рекомендуется обратить внимание на принципы SOLID (Single Responsibility и Dependency Inversion), так как обнаружены нарушения в модуле ArchitectureDiagram.',
      },
      aiReviewEvaluation: null,
    },
  ],
  [
    9904,
    {
      id: 103,
      taskId: 9904,
      status: REVIEW_STATUS.COMPLETED,
      uploadedAt: makeDate(-4, 10, 0),
      deadline: makeDate(1, 10, 0),
      files: COMMON_FILES,
      comments: MOCK_LARGE_COMMENTS,
      finalReviews: [
        {
          id: 204,
          reviewerId: 100,
          reviewerName: 'AI Agent',
          architecture: 5,
          readability: 5,
          testability: 5,
          scalability: 5,
          comment: 'Код полностью соответствует стандартам проекта.',
          verdict: 'APPROVED',
        },
        {
          id: 205,
          reviewerId: 12,
          reviewerName: 'Романов Александр Сергеевич',
          architecture: 5,
          readability: 4,
          testability: 5,
          scalability: 4,
          comment: 'Хороший код, архитектура продумана.',
          verdict: 'APPROVED',
          revealName: true,
        },
      ],
      history: [],
      aiEvaluation: {
        qualityScore: 4.9,
        cyclomaticComplexity: 'A (Отлично)',
        solidViolations: {
          count: 0,
          severity: 'Проблем нет',
        },
        overallComment:
          'Отличная работа! Код чистый, иерархия компонентов выстроена логично, а цикломатическая сложность минимальна. Нарушений принципов SOLID не обнаружено.',
      },
      aiReviewEvaluation: {
        qualityScore: 4.8,
        specificity: 5,
        techDepth: 4,
        correctness: 5,
        nonToxicity: 5,
      },
    },
  ],
  [
    9801,
    {
      id: 201,
      taskId: 9801,
      status: REVIEW_STATUS.NEW,
      uploadedAt: makeDate(-1, 11, 0),
      deadline: makeDate(3, 10, 0),
      files: DIFF_FILES,
      comments: [],
      finalReviews: [],
      history: [],
      aiEvaluation: null,
      aiReviewEvaluation: null,
    },
  ],
  [
    9802,
    {
      id: 202,
      taskId: 9802,
      status: REVIEW_STATUS.IN_PROGRESS,
      uploadedAt: makeDate(-3, 14, 0),
      deadline: makeDate(1, 15, 0),
      reviewedAt: makeDate(-1, 12, 0),
      files: COMMON_FILES,
      comments: MOCK_LARGE_COMMENTS.filter((c: LegacyValue) => !c.isClosed),
      finalReviews: [
        {
          id: 205,
          reviewerId: 12,
          reviewerName: 'Романов Александр Сергеевич',
          architecture: 3,
          readability: 4,
          testability: 2,
          scalability: 3,
          comment: 'Нужна доработка. Смотри новые комментарии.',
          verdict: 'REWORK',
        },
      ],
      history: [
        {
          id: 402,
          taskId: 9802,
          status: 'REWORK',
          uploadedAt: makeDate(-6, 10, 0),
          files: COMMON_FILES,
          comments: MOCK_REWORK_HISTORY_COMMENTS,
          finalReviews: [
            {
              id: 2051,
              reviewerId: 57,
              reviewerName: 'Муравьев Илья Германович',
              architecture: 2,
              readability: 3,
              testability: 2,
              scalability: 2,
              comment: 'В первой версии много багов, нужно переписать.',
              verdict: 'REWORK',
            },
          ],
          isHistory: true,
        },
      ],
      aiEvaluation: {
        qualityScore: 3.5,
        cyclomaticComplexity: 'C (Удовлетворительно)',
        solidViolations: {
          count: 1,
          severity: 'Низкая',
        },
        overallComment:
          'В решении присутствует излишняя вложенность в функциях обработки CI/CD логов. Рекомендуется провести рефакторинг для снижения сложности.',
      },
      aiReviewEvaluation: null,
    },
  ],
  [
    9803,
    {
      id: 203,
      taskId: 9803,
      status: REVIEW_STATUS.COMPLETED,
      uploadedAt: makeDate(-5, 10, 0),
      deadline: makeDate(-2, 12, 0),
      reviewedAt: makeDate(-3, 10, 0),
      files: COMMON_FILES,
      comments: MOCK_LARGE_COMMENTS,
      finalReviews: [
        {
          id: 206,
          reviewerId: 57,
          reviewerName: 'Муравьев Илья Германович',
          architecture: 5,
          readability: 4,
          testability: 4,
          scalability: 5,
          comment: 'Отличная работа!',
          verdict: 'APPROVED',
        },
        {
          id: 207,
          reviewerId: 12,
          reviewerName: 'Романов Александр Сергеевич',
          architecture: 4,
          readability: 5,
          testability: 4,
          scalability: 4,
          comment: 'Всё ок.',
          verdict: 'APPROVED',
        },
      ],
      history: [
        {
          id: 403,
          taskId: 9803,
          status: REVIEW_STATUS.IN_PROGRESS,
          uploadedAt: makeDate(-8, 10, 0),
          files: COMMON_FILES,
          comments: MOCK_REWORK_HISTORY_COMMENTS,
          finalReviews: [
            {
              id: 2061,
              reviewerId: 57,
              reviewerName: 'Муравьев Илья Германович',
              architecture: 3,
              readability: 3,
              testability: 3,
              scalability: 3,
              comment: 'Забыл про lodash.',
              verdict: 'REWORK',
            },
            {
              id: 2071,
              reviewerId: 12,
              reviewerName: 'Романов Александр Сергеевич',
              architecture: 3,
              readability: 3,
              testability: 3,
              scalability: 3,
              comment: 'Доработай импорты.',
              verdict: 'REWORK',
            },
          ],
          isHistory: true,
        },
      ],
      aiEvaluation: {
        qualityScore: 4.8,
        cyclomaticComplexity: 'A (Отлично)',
        solidViolations: {
          count: 0,
          severity: 'Проблем нет',
        },
        overallComment:
          'Высокое качество кода. Логика интеграции Sentry вынесена в отдельный сервис, что упрощает тестирование и дальнейшую поддержку.',
      },
      aiReviewEvaluation: {
        qualityScore: 4.5,
        specificity: 4,
        techDepth: 5,
        correctness: 4,
        nonToxicity: 5,
      },
    },
  ],
  [
    9804,
    {
      id: 204,
      taskId: 9804,
      status: REVIEW_STATUS.NEW,
      uploadedAt: makeDate(-1, 8, 0),
      deadline: makeDate(1, 10, 0),
      files: COMMON_FILES,
      comments: [],
      finalReviews: [],
      history: [],
      aiEvaluation: null,
      aiReviewEvaluation: null,
    },
  ],
  [
    9805,
    {
      id: 205,
      taskId: 9805,
      status: REVIEW_STATUS.IN_PROGRESS,
      uploadedAt: makeDate(-2, 9, 30),
      deadline: makeDate(2, 10, 0),
      reviewedAt: makeDate(0, 10, 0),
      files: COMMON_FILES,
      comments: MOCK_LARGE_COMMENTS.filter((c: LegacyValue) => c.id % 2 === 0),
      finalReviews: [],
      history: [],
      aiEvaluation: null,
      aiReviewEvaluation: null,
    },
  ],
  [
    9806,
    {
      id: 206,
      taskId: 9806,
      status: REVIEW_STATUS.COMPLETED,
      uploadedAt: makeDate(-7, 10, 0),
      deadline: makeDate(-4, 12, 0),
      reviewedAt: makeDate(-5, 12, 0),
      files: COMMON_FILES,
      comments: [],
      finalReviews: [
        {
          id: 208,
          reviewerId: 57,
          reviewerName: 'Муравьев Илья Германович',
          architecture: 5,
          readability: 5,
          testability: 5,
          scalability: 5,
          comment: 'Идеальный код.',
          verdict: 'APPROVED',
        },
      ],
      history: [],
      aiEvaluation: null,
      aiReviewEvaluation: null,
    },
  ],
]);
export const MOCK_ASSIGNED_REVIEWS = [
  {
    id: 201,
    reviewerId: 57,
    taskId: 9801,
    taskName: 'Сделать auth middleware',
    project: {
      id: 9999,
      name: 'Personal Architecture Notes',
    },
    organization: {
      id: 300,
      name: 'CodeBattles Team',
    },
    uploadedAt: makeDate(-10, 11, 0),
    responseDeadline: makeDate(-3, 10, 0),
    status: REVIEW_STATUS.NEW,
    commentsCount: 0,
    checkedByReviewer: false,
    reviewedAt: null,
    revealAuthorAfterReview: true,
  },
  {
    id: 202,
    reviewerId: 57,
    taskId: 9802,
    taskName: 'Настроить CI/CD',
    project: {
      id: 9999,
      name: 'Personal Architecture Notes',
    },
    organization: {
      id: 300,
      name: 'CodeBattles Team',
    },
    uploadedAt: makeDate(-3, 14, 0),
    responseDeadline: makeDate(1, 15, 0),
    status: REVIEW_STATUS.IN_PROGRESS,
    commentsCount: 4,
    checkedByReviewer: true,
    reviewedAt: makeDate(-1, 12, 0),
    revealAuthorAfterReview: true,
  },
  {
    id: 203,
    reviewerId: 57,
    taskId: 9803,
    taskName: 'Интеграция Sentry',
    project: {
      id: 9999,
      name: 'Personal Architecture Notes',
    },
    organization: {
      id: 300,
      name: 'CodeBattles Team',
    },
    uploadedAt: makeDate(-5, 10, 0),
    responseDeadline: makeDate(-2, 12, 0),
    status: REVIEW_STATUS.COMPLETED,
    commentsCount: 5,
    checkedByReviewer: true,
    reviewedAt: makeDate(-3, 10, 0),
    revealAuthorAfterReview: false,
  },
  {
    id: 204,
    reviewerId: 57,
    taskId: 9804,
    taskName: 'Редизайн профиля',
    project: {
      id: 8888,
      name: 'Backend Microservices',
    },
    organization: {
      id: 300,
      name: 'CodeBattles Team',
    },
    uploadedAt: makeDate(-1, 8, 0),
    responseDeadline: makeDate(1, 10, 0),
    status: REVIEW_STATUS.NEW,
    commentsCount: 0,
    checkedByReviewer: false,
    reviewedAt: null,
    revealAuthorAfterReview: true,
  },
  {
    id: 205,
    reviewerId: 57,
    taskId: 9805,
    taskName: 'Оптимизация сборки',
    project: {
      id: 7777,
      name: 'AI Research',
    },
    organization: {
      id: 400,
      name: 'DeepMind Corp',
    },
    uploadedAt: makeDate(-2, 9, 30),
    responseDeadline: makeDate(2, 10, 0),
    status: REVIEW_STATUS.IN_PROGRESS,
    commentsCount: 2,
    checkedByReviewer: true,
    reviewedAt: makeDate(0, 10, 0),
    revealAuthorAfterReview: true,
  },
  {
    id: 206,
    reviewerId: 57,
    taskId: 9806,
    taskName: 'Написать юнит тесты',
    project: {
      id: 6666,
      name: 'My Personal Website',
    },
    organization: null,
    uploadedAt: makeDate(-7, 10, 0),
    responseDeadline: makeDate(-4, 12, 0),
    status: REVIEW_STATUS.COMPLETED,
    commentsCount: 0,
    checkedByReviewer: true,
    reviewedAt: makeDate(-5, 12, 0),
    revealAuthorAfterReview: false,
  },
];

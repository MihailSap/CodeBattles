import { ADMIN_COMPLAINT_DECISION, ADMIN_COMPLAINT_PENALTY_POINTS, ADMIN_EVENT_TYPE } from '../model/constants';

const clone = (value: LegacyValue) => JSON.parse(JSON.stringify(value));
const now = new Date('2026-05-21T11:20:00+05:00');

const makeIso = (daysAgo: LegacyValue, hours: LegacyValue = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hours);

  return date.toISOString();
};

const paginate = (items: LegacyValue, page: LegacyValue = 0, size: LegacyValue = 10) => {
  const normalizedPage = Math.max(0, Number(page) || 0);
  const normalizedSize = Math.max(1, Number(size) || 10);
  const totalElements = items.length;
  const totalPages = Math.ceil(totalElements / normalizedSize);
  const start = normalizedPage * normalizedSize;

  return {
    content: clone(items.slice(start, start + normalizedSize)),
    page: normalizedPage,
    size: normalizedSize,
    totalElements,
    totalPages,
  };
};

const usersPenaltyState = new Map([
  [23, 1],
  [31, 0],
  [42, 2],
  [54, 0],
  [77, 1],
]);

let eventSequence = 30;

const DEFAULT_ADMIN_ACTOR = {
  id: 1,
  login: 'admin_anna',
  fullName: 'Анна Админова',
};

const MOCK_AI_FEEDBACK_COMMENTS = [
  {
    id: 6401,
    reviewId: 452,
    taskId: 118,
    text: 'Проверка прав доступа не покрывает случай истекшего refresh token.',
    createdAt: makeIso(1, 2),
    likedBy: [8, 12, 18, 29, 31, 42],
    dislikedBy: [54],
  },
  {
    id: 6402,
    reviewId: 443,
    taskId: 111,
    text: 'Стоит вынести повторяющуюся нормализацию дат в отдельный helper.',
    createdAt: makeIso(2, 4),
    likedBy: [15, 21, 34, 45],
    dislikedBy: [],
  },
  {
    id: 6403,
    reviewId: 439,
    taskId: 106,
    text: 'Ветка обработки ошибки не возвращает пользовательское сообщение.',
    createdAt: makeIso(4, 1),
    likedBy: [8, 19, 23, 31, 55, 62, 73],
    dislikedBy: [12, 64],
  },
  {
    id: 6404,
    reviewId: 431,
    taskId: 98,
    text: 'Компонент делает лишний запрос при каждом изменении фильтра.',
    createdAt: makeIso(7, 5),
    likedBy: [18, 21, 29],
    dislikedBy: [42],
  },
  {
    id: 6405,
    reviewId: 428,
    taskId: 95,
    text: 'Для этой формы не хватает проверки минимальной длины ответа.',
    createdAt: makeIso(9, 3),
    likedBy: [12, 15, 34, 45, 54],
    dislikedBy: [],
  },
  {
    id: 6406,
    reviewId: 420,
    taskId: 92,
    text: 'Название переменной не отражает, что значение уже отфильтровано.',
    createdAt: makeIso(12, 6),
    likedBy: [8, 19],
    dislikedBy: [23, 31, 77],
  },
  {
    id: 6407,
    reviewId: 417,
    taskId: 89,
    text: 'Похоже, здесь нужен optimistic update, иначе интерфейс заметно дергается.',
    createdAt: makeIso(16, 2),
    likedBy: [12, 18, 21, 29, 34, 42, 55, 62],
    dislikedBy: [64],
  },
  {
    id: 6408,
    reviewId: 409,
    taskId: 82,
    text: 'Проверка роли должна выполняться до вычисления доступных действий.',
    createdAt: makeIso(21, 1),
    likedBy: [8, 15, 23, 45, 73],
    dislikedBy: [31, 54],
  },
  {
    id: 6409,
    reviewId: 401,
    taskId: 75,
    text: 'Комментарий к коду дублирует название функции и не добавляет смысла.',
    createdAt: makeIso(25, 4),
    likedBy: [19, 29, 34],
    dislikedBy: [12],
  },
  {
    id: 6410,
    reviewId: 398,
    taskId: 71,
    text: 'Можно заменить вложенные условия ранними выходами и упростить чтение.',
    createdAt: makeIso(29, 0),
    likedBy: [8, 12, 18, 21, 23, 31, 42, 45, 55],
    dislikedBy: [],
  },
];

const getAiFeedbackStats = () =>
  MOCK_AI_FEEDBACK_COMMENTS.reduce(
    (accumulator: LegacyValue, comment: LegacyValue) => ({
      ...accumulator,
      totalLikes: accumulator.totalLikes + comment.likedBy.length,
      totalDislikes: accumulator.totalDislikes + comment.dislikedBy.length,
    }),
    {
      totalLikes: 0,
      totalDislikes: 0,
    }
  );

let settings = {
  reviewDeadlineDays: 14,
  aiSystemPrompt:
    'Ты строгий, но конструктивный AI-ревьюер. Оценивай корректность, читаемость, безопасность, производительность и соответствие условиям задачи. Давай короткие, проверяемые рекомендации.',
  aiFeedbackStats: getAiFeedbackStats(),
};

let complaints = [
  {
    id: 1,
    commentId: 8101,
    commentText: 'Ты вообще читал задачу? Такой код только время команды тратит.',
    commentAuthor: {
      id: 23,
      login: 'max_refactor',
      fullName: 'Максим Орлов',
    },
    target: {
      kind: 'review',
      title: 'Review #452: REST API для турниров',
      url: '/reviews/452',
    },
    reason: 'Оскорбительный тон',
    reportedBy: {
      id: 8,
      login: 'nina_dev',
      fullName: 'Нина Волкова',
    },
    createdAt: makeIso(0, 1),
  },
  {
    id: 2,
    commentId: 8102,
    commentText: 'Можно было бы не копировать чужое решение из прошлого баттла.',
    commentAuthor: {
      id: 31,
      login: 'frontend_ilya',
      fullName: 'Илья Соколов',
    },
    target: {
      kind: 'task',
      title: 'Задача #118: Очередь задач',
      url: '/projects/3/tasks/118',
    },
    reason: 'Обвинение без доказательств',
    reportedBy: {
      id: 12,
      login: 'elena_code',
      fullName: 'Елена Романова',
    },
    createdAt: makeIso(0, 3),
  },
  {
    id: 3,
    commentId: 8103,
    commentText: 'AI уже написал лучше, чем ты. Удали и начни заново.',
    commentAuthor: {
      id: 42,
      login: 'stack_runner',
      fullName: 'Артем Ким',
    },
    target: {
      kind: 'review',
      title: 'Review #443: Auth flow',
      url: '/reviews/443',
    },
    reason: 'Токсичный комментарий',
    reportedBy: {
      id: 18,
      login: 'qa_maria',
      fullName: 'Мария Котова',
    },
    createdAt: makeIso(1, 0),
  },
  {
    id: 4,
    commentId: 8104,
    commentText: 'Этот подход ломает кеширование на повторном запросе. Нужен invalidate по taskId.',
    commentAuthor: {
      id: 54,
      login: 'redux_doc',
      fullName: 'Антон Ковалев',
    },
    target: {
      kind: 'task',
      title: 'Задача #126: RTK Query cache',
      url: '/projects/5/tasks/126',
    },
    reason: 'Спам жалоба, комментарий кажется нормальным',
    reportedBy: {
      id: 21,
      login: 'dasha_fullstack',
      fullName: 'Дарья Петрова',
    },
    createdAt: makeIso(1, 4),
  },
  {
    id: 5,
    commentId: 8105,
    commentText: 'Без тестов этот PR нельзя принимать, даже если демо выглядит нормально.',
    commentAuthor: {
      id: 77,
      login: 'test_first',
      fullName: 'Сергей Лебедев',
    },
    target: {
      kind: 'review',
      title: 'Review #439: UI notifications',
      url: '/reviews/439',
    },
    reason: 'Неуважительный тон',
    reportedBy: {
      id: 34,
      login: 'ui_vika',
      fullName: 'Виктория Сергеева',
    },
    createdAt: makeIso(2, 2),
  },
  {
    id: 6,
    commentId: 8106,
    commentText: 'Если снова отправишь такое без линтера, ревью не имеет смысла.',
    commentAuthor: {
      id: 23,
      login: 'max_refactor',
      fullName: 'Максим Орлов',
    },
    target: {
      kind: 'review',
      title: 'Review #438: Leaderboard filters',
      url: '/reviews/438',
    },
    reason: 'Давление на автора',
    reportedBy: {
      id: 43,
      login: 'rustam_js',
      fullName: 'Рустам Галиев',
    },
    createdAt: makeIso(2, 5),
  },
  {
    id: 7,
    commentId: 8107,
    commentText: 'Пожалуйста, вынеси повторяющуюся проверку в helper, сейчас это сложно читать.',
    commentAuthor: {
      id: 19,
      login: 'clean_code',
      fullName: 'Ольга Миронова',
    },
    target: {
      kind: 'task',
      title: 'Задача #104: Парсер логов',
      url: '/projects/2/tasks/104',
    },
    reason: 'Жалоба на спорный комментарий',
    reportedBy: {
      id: 55,
      login: 'roman_api',
      fullName: 'Роман Васильев',
    },
    createdAt: makeIso(3, 1),
  },
  {
    id: 8,
    commentId: 8108,
    commentText: 'Ты опять игнорируешь требования по доступности.',
    commentAuthor: {
      id: 42,
      login: 'stack_runner',
      fullName: 'Артем Ким',
    },
    target: {
      kind: 'review',
      title: 'Review #431: Profile settings',
      url: '/reviews/431',
    },
    reason: 'Резкая формулировка',
    reportedBy: {
      id: 29,
      login: 'a11y_lena',
      fullName: 'Лена Аксенова',
    },
    createdAt: makeIso(4, 6),
  },
  {
    id: 9,
    commentId: 8109,
    commentText: 'Этот if можно заменить ранним return, тогда ветвление будет проще.',
    commentAuthor: {
      id: 64,
      login: 'sergey_node',
      fullName: 'Сергей Фомин',
    },
    target: {
      kind: 'task',
      title: 'Задача #97: Webhook events',
      url: '/projects/7/tasks/97',
    },
    reason: 'Ошибочная жалоба',
    reportedBy: {
      id: 15,
      login: 'pm_alex',
      fullName: 'Алексей Павлов',
    },
    createdAt: makeIso(5, 0),
  },
  {
    id: 10,
    commentId: 8110,
    commentText: 'Такой код нельзя показывать новичкам, он закрепляет плохие привычки.',
    commentAuthor: {
      id: 88,
      login: 'mentor_old',
      fullName: 'Павел Титов',
    },
    target: {
      kind: 'review',
      title: 'Review #428: Invite links',
      url: '/reviews/428',
    },
    reason: 'Уничижительная формулировка',
    reportedBy: {
      id: 73,
      login: 'newbie_sasha',
      fullName: 'Саша Белова',
    },
    createdAt: makeIso(5, 3),
  },
  {
    id: 11,
    commentId: 8111,
    commentText: 'Сравнение дат через строки здесь рискованное, лучше нормализовать Date.',
    commentAuthor: {
      id: 91,
      login: 'date_guard',
      fullName: 'Кирилл Егоров',
    },
    target: {
      kind: 'task',
      title: 'Задача #92: Calendar sync',
      url: '/projects/8/tasks/92',
    },
    reason: 'Спор по содержанию',
    reportedBy: {
      id: 45,
      login: 'ivan_tz',
      fullName: 'Иван Морозов',
    },
    createdAt: makeIso(6, 2),
  },
  {
    id: 12,
    commentId: 8112,
    commentText: 'Похоже на автогенерацию без понимания, но баг с null все равно надо закрыть.',
    commentAuthor: {
      id: 31,
      login: 'frontend_ilya',
      fullName: 'Илья Соколов',
    },
    target: {
      kind: 'review',
      title: 'Review #420: Task details',
      url: '/reviews/420',
    },
    reason: 'Сомнительное обвинение',
    reportedBy: {
      id: 62,
      login: 'katya_backend',
      fullName: 'Катя Смирнова',
    },
    createdAt: makeIso(7, 1),
  },
];

let events = [
  ...complaints.map((complaint: LegacyValue) => ({
    id: eventSequence++,
    type: ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_CREATED,
    createdAt: complaint.createdAt,
    actor: complaint.reportedBy,
    targetUser: complaint.commentAuthor,
    target: complaint.target,
    reason: complaint.reason,
    decision: null,
    consequence: 'Ожидает решения модератора',
    details: `Жалоба на комментарий #${complaint.commentId}: ${complaint.commentText.slice(0, 90)}`,
  })),
  {
    id: eventSequence++,
    type: ADMIN_EVENT_TYPE.LEADERBOARD_RATING_RESET,
    createdAt: makeIso(2, 7),
    actor: DEFAULT_ADMIN_ACTOR,
    targetUser: {
      id: 31,
      login: 'frontend_ilya',
      fullName: 'Илья Соколов',
    },
    scope: {
      type: 'PROJECT',
      name: 'CodeBattles Frontend Arena',
      url: '/projects/5',
    },
    details: 'Рейтинг пользователя обнулен в рамках проектного лидерборда',
  },
  {
    id: eventSequence++,
    type: ADMIN_EVENT_TYPE.SYSTEM_REVIEW_DEADLINE_CHANGED,
    createdAt: makeIso(4, 1),
    actor: DEFAULT_ADMIN_ACTOR,
    previousValue: '10 дней',
    newValue: '14 дней',
    details: 'Срок проверки ревью обновлен',
  },
  {
    id: eventSequence++,
    type: ADMIN_EVENT_TYPE.SYSTEM_AI_PROMPT_CHANGED,
    createdAt: makeIso(8, 0),
    actor: DEFAULT_ADMIN_ACTOR,
    previousValue: 'Ты AI-ревьюер...',
    newValue: 'Ты строгий, но конструктивный AI-ревьюер...',
    details: 'Изменен системный промпт AI-модели',
  },
].sort((a: LegacyValue, b: LegacyValue) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const pushEvent = (event: LegacyValue) => {
  events = [
    {
      id: eventSequence++,
      createdAt: new Date().toISOString(),
      ...event,
    },
    ...events,
  ];
};

export const adminApi: LegacyValue = {
  async getComplaints(params: LegacyValue = {}) {
    return paginate(
      [...complaints].sort(
        (a: LegacyValue, b: LegacyValue) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      params.page,
      params.size
    );
  },
  async resolveComplaint(complaintId: LegacyValue, payload: LegacyValue) {
    const complaint = complaints.find((item: LegacyValue) => Number(item.id) === Number(complaintId));

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    complaints = complaints.filter((item: LegacyValue) => Number(item.id) !== Number(complaintId));
    const moderator = payload.moderator || DEFAULT_ADMIN_ACTOR;
    const isApproved = payload.decision === ADMIN_COMPLAINT_DECISION.APPROVE;
    let consequence = 'Жалоба отклонена, комментарий оставлен без изменений';

    if (isApproved) {
      const previousApprovedCount = usersPenaltyState.get(complaint.commentAuthor.id) || 0;
      const nextApprovedCount = previousApprovedCount + 1;
      usersPenaltyState.set(complaint.commentAuthor.id, nextApprovedCount);

      consequence =
        previousApprovedCount === 0
          ? 'Комментарий удален. Первое подтверждение жалобы: предупреждение без штрафа'
          : `Комментарий удален. Начислен штраф -${ADMIN_COMPLAINT_PENALTY_POINTS} баллов`;
    }

    pushEvent({
      type: isApproved ? ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_APPROVED : ADMIN_EVENT_TYPE.COMMENT_COMPLAINT_REJECTED,
      actor: moderator,
      targetUser: complaint.commentAuthor,
      target: complaint.target,
      reason: complaint.reason,
      decision: isApproved ? 'Подтверждена' : 'Отклонена',
      consequence,
      details: `Решение по жалобе #${complaint.id} на комментарий #${complaint.commentId}`,
    });

    return {
      complaintId: complaint.id,
      decision: payload.decision,
      consequence,
    };
  },
  async getSystemSettings() {
    return clone(settings);
  },
  async updateReviewDeadlineDays(payload: LegacyValue) {
    const previousValue = settings.reviewDeadlineDays;
    const nextValue = Math.max(1, Number(payload.reviewDeadlineDays) || 14);

    settings = {
      ...settings,
      reviewDeadlineDays: nextValue,
    };

    pushEvent({
      type: ADMIN_EVENT_TYPE.SYSTEM_REVIEW_DEADLINE_CHANGED,
      actor: payload.actor || DEFAULT_ADMIN_ACTOR,
      previousValue: `${previousValue} дней`,
      newValue: `${nextValue} дней`,
      details: 'Изменен срок проверки ревью',
    });

    return clone(settings);
  },
  async updateAiSystemPrompt(payload: LegacyValue) {
    const previousPrompt = settings.aiSystemPrompt;
    const nextPrompt = String(payload.aiSystemPrompt || '').trim();

    settings = {
      ...settings,
      aiSystemPrompt: nextPrompt,
    };

    pushEvent({
      type: ADMIN_EVENT_TYPE.SYSTEM_AI_PROMPT_CHANGED,
      actor: payload.actor || DEFAULT_ADMIN_ACTOR,
      previousValue: previousPrompt.slice(0, 120),
      newValue: nextPrompt.slice(0, 120),
      details: 'Изменен системный промпт AI-модели',
    });

    return clone(settings);
  },
  async getEvents(params: LegacyValue = {}) {
    const dateFrom = params.dateFrom ? new Date(`${params.dateFrom}T00:00:00`).getTime() : null;
    const dateTo = params.dateTo ? new Date(`${params.dateTo}T23:59:59`).getTime() : null;

    const filtered = events.filter((event: LegacyValue) => {
      const eventTime = new Date(event.createdAt).getTime();
      const typeMatches = params.type ? event.type === params.type : true;
      const fromMatches = dateFrom ? eventTime >= dateFrom : true;
      const toMatches = dateTo ? eventTime <= dateTo : true;

      return typeMatches && fromMatches && toMatches;
    });

    return paginate(filtered, params.page, params.size);
  },
};

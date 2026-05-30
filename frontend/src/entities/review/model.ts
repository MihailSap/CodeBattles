export const REVIEW_STATUS = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
export const REVIEW_STATUS_LABEL = {
  [REVIEW_STATUS.NEW]: 'Новое',
  [REVIEW_STATUS.IN_PROGRESS]: 'В работе',
  [REVIEW_STATUS.COMPLETED]: 'Завершено',
} as const satisfies Record<ReviewStatus, string>;
export const REVIEW_SORT = {
  NEAREST_FIRST: 'NEAREST_FIRST',
  FARTHEST_FIRST: 'FARTHEST_FIRST',
} as const;
export type ReviewSort = (typeof REVIEW_SORT)[keyof typeof REVIEW_SORT];
export const REVIEW_SORT_LABEL = {
  [REVIEW_SORT.NEAREST_FIRST]: 'Сначала ближайшие',
  [REVIEW_SORT.FARTHEST_FIRST]: 'Сначала дальнейшие',
} as const satisfies Record<ReviewSort, string>;
export const COMMENT_CATEGORY = {
  BUG: 'BUG',
  PERFORMANCE: 'PERFORMANCE',
  SECURITY: 'SECURITY',
  ARCHITECTURE: 'ARCHITECTURE',
  CODE_STYLE: 'CODE_STYLE',
  BEST_PRACTICES: 'BEST_PRACTICES',
  REFACTORING: 'REFACTORING',
  OTHER: 'OTHER',
} as const;
export type CommentCategory = (typeof COMMENT_CATEGORY)[keyof typeof COMMENT_CATEGORY];
export const COMMENT_CATEGORY_LABEL = {
  [COMMENT_CATEGORY.BUG]: 'Баг',
  [COMMENT_CATEGORY.PERFORMANCE]: 'Производительность',
  [COMMENT_CATEGORY.SECURITY]: 'Безопасность',
  [COMMENT_CATEGORY.ARCHITECTURE]: 'Архитектура',
  [COMMENT_CATEGORY.CODE_STYLE]: 'Стиль кода',
  [COMMENT_CATEGORY.BEST_PRACTICES]: 'Лучшие практики',
  [COMMENT_CATEGORY.REFACTORING]: 'Предложение по рефакторингу',
  [COMMENT_CATEGORY.OTHER]: 'Другое',
} as const satisfies Record<CommentCategory, string>;
export const COMMENT_CATEGORY_COLOR = {
  [COMMENT_CATEGORY.BUG]: '#f85149',
  [COMMENT_CATEGORY.PERFORMANCE]: '#f0883e',
  [COMMENT_CATEGORY.SECURITY]: '#800020',
  [COMMENT_CATEGORY.ARCHITECTURE]: '#9c27b0',
  [COMMENT_CATEGORY.CODE_STYLE]: '#808080',
  [COMMENT_CATEGORY.BEST_PRACTICES]: '#1565c0',
  [COMMENT_CATEGORY.REFACTORING]: '#15c059',
  [COMMENT_CATEGORY.OTHER]: '#ffcc00',
} as const satisfies Record<CommentCategory, string>;
export const COMMENT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type CommentSeverity = (typeof COMMENT_SEVERITY)[keyof typeof COMMENT_SEVERITY];
export const COMMENT_SEVERITY_LABEL = {
  [COMMENT_SEVERITY.LOW]: 'Низкий',
  [COMMENT_SEVERITY.MEDIUM]: 'Средний',
  [COMMENT_SEVERITY.HIGH]: 'Высокий',
} as const satisfies Record<CommentSeverity, string>;
export const REPORT_REASON = {
  OFFENSIVE: 'OFFENSIVE',
  SPAM: 'SPAM',
  IRRELEVANT: 'IRRELEVANT',
  INCORRECT: 'INCORRECT',
  DISCLOSES_IDENTITY: 'DISCLOSES_IDENTITY',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof REPORT_REASON)[keyof typeof REPORT_REASON];
export const REPORT_REASON_LABEL = {
  [REPORT_REASON.OFFENSIVE]: 'Оскорбительное поведение',
  [REPORT_REASON.SPAM]: 'Спам',
  [REPORT_REASON.IRRELEVANT]: 'Не относится к ревью',
  [REPORT_REASON.INCORRECT]: 'Некорректное техническое утверждение',
  [REPORT_REASON.DISCLOSES_IDENTITY]: 'Раскрывает личность участника',
  [REPORT_REASON.OTHER]: 'Другое',
} as const satisfies Record<ReportReason, string>;
export const REPORT_REASONS = Object.values(REPORT_REASON);

export interface DeadlineInfo {
  label: string;
  date: string;
  isOverdue: boolean;
}

export const getDeadlineInfo = (
  deadline: string | null | undefined,
  status: ReviewStatus,
  reviewedAt?: string | null
): DeadlineInfo | null => {
  if (!deadline) {
    return null;
  }

  const now = new Date();
  const dDate = new Date(deadline);
  const isCompleted = status === REVIEW_STATUS.COMPLETED;

  const dateStr = dDate.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isCompleted) {
    const reviewedTime = reviewedAt ? new Date(reviewedAt).getTime() : null;
    const isOverdue = reviewedTime ? reviewedTime > dDate.getTime() : false;

    return {
      label: isOverdue ? 'Просрочено' : 'Проверено',
      date: dateStr,
      isOverdue,
    };
  }

  const isOverdue = dDate < now;

  if (isOverdue) {
    return {
      label: 'Просрочено',
      date: dateStr,
      isOverdue: true,
    };
  }

  const diffMs = dDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let daysLabel = 'дней';
  if (diffDays % 10 === 1 && diffDays % 100 !== 11) daysLabel = 'день';
  else if (diffDays % 10 >= 2 && diffDays % 10 <= 4 && (diffDays % 100 < 12 || diffDays % 100 > 14)) daysLabel = 'дня';

  return {
    label: `Осталось ${diffDays} ${daysLabel}`,
    date: dateStr,
    isOverdue: false,
  };
};

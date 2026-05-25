export const PROJECT_PRIVACY = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;
export type ProjectPrivacy = (typeof PROJECT_PRIVACY)[keyof typeof PROJECT_PRIVACY];
export const PROJECT_PRIVACY_LABELS = {
  [PROJECT_PRIVACY.PUBLIC]: 'Публичный',
  [PROJECT_PRIVACY.PRIVATE]: 'Приватный',
} as const satisfies Record<ProjectPrivacy, string>;
export const PROJECT_MEMBER_ROLE = {
  OWNER: 'OWNER',
  DEVELOPER: 'MEMBER',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLE)[keyof typeof PROJECT_MEMBER_ROLE];
export const PROJECT_MEMBER_ROLE_LABELS = {
  [PROJECT_MEMBER_ROLE.OWNER]: 'Владелец',
  [PROJECT_MEMBER_ROLE.MEMBER]: 'Участник',
  [PROJECT_MEMBER_ROLE.GUEST]: 'Гость',
} as const satisfies Record<ProjectMemberRole, string>;
export const TASK_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  REWORK: 'REWORK',
  DONE: 'DONE',
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.IN_PROGRESS]: 'В работе',
  [TASK_STATUS.IN_REVIEW]: 'На ревью',
  [TASK_STATUS.REWORK]: 'Доработка',
  [TASK_STATUS.DONE]: 'Выполнено',
} as const satisfies Record<TaskStatus, string>;
export const TASK_STATUS_ORDER: readonly TaskStatus[] = [
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.REWORK,
  TASK_STATUS.IN_REVIEW,
  TASK_STATUS.DONE,
];
export const TASK_REVIEW_TYPE = {
  MANUAL_ASSIGNEES: 'MANUAL_ASSIGNEES',
  AI_ONLY: 'AI_ONLY',
  AUTO_PROJECT: 'AUTO_PROJECT',
  AUTO_ORGANIZATION: 'AUTO_ORGANIZATION',
} as const;
export type TaskReviewType = (typeof TASK_REVIEW_TYPE)[keyof typeof TASK_REVIEW_TYPE];
export const TASK_REVIEW_TYPE_LABELS = {
  [TASK_REVIEW_TYPE.MANUAL_ASSIGNEES]: 'Ручное назначение ревьюеров',
  [TASK_REVIEW_TYPE.AI_ONLY]: 'Только AI',
  [TASK_REVIEW_TYPE.AUTO_PROJECT]: 'Автоматическое по проекту',
  [TASK_REVIEW_TYPE.AUTO_ORGANIZATION]: 'Автоматическое по организации',
} as const satisfies Record<TaskReviewType, string>;
export const ACCESS_ERROR_CODE = {
  FORBIDDEN_PROJECT: 'FORBIDDEN_PROJECT',
  FORBIDDEN_ORGANIZATION: 'FORBIDDEN_ORGANIZATION',
  FORBIDDEN_TASK_PROJECT_MEMBER: 'FORBIDDEN_TASK_PROJECT_MEMBER',
  FORBIDDEN_TASK_ASSIGNEE: 'FORBIDDEN_TASK_ASSIGNEE',
  INVALID_INVITE: 'INVALID_INVITE',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
} as const;
export type AccessErrorCode = (typeof ACCESS_ERROR_CODE)[keyof typeof ACCESS_ERROR_CODE];

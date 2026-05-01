import { REVIEW_STATUS } from './review';

const DAY_MS = 24 * 60 * 60 * 1000;

const daysFromNow = (days, hours = 12, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const REVIEWS_MOCK = [
  {
    id: 9001,
    reviewerId: 57,
    taskId: 5003,
    taskName: 'Реализовать табы страницы проекта',
    project: { id: 1001, name: 'CodeBattles Front Platform' },
    organization: { id: 300, name: 'CodeBattles Team' },
    author: { id: 14, login: 'lina_code' },
    uploadedAt: daysFromNow(-2, 11, 20),
    responseDeadline: daysFromNow(1, 19, 0),
    status: REVIEW_STATUS.NEW,
    commentsCount: 0,
    checkedByReviewer: false,
    reviewedAt: null,
    revealAuthorAfterReview: true
  },
  {
    id: 9002,
    reviewerId: 57,
    taskId: 5008,
    taskName: 'Добавить аудит действий',
    project: { id: 1003, name: 'Enterprise Security Console' },
    organization: { id: 300, name: 'CodeBattles Team' },
    author: { id: 12, login: 'alexr' },
    uploadedAt: daysFromNow(-4, 14, 45),
    responseDeadline: daysFromNow(-1, 12, 0),
    status: REVIEW_STATUS.IN_PROGRESS,
    commentsCount: 8,
    checkedByReviewer: false,
    reviewedAt: null,
    revealAuthorAfterReview: true
  },
  {
    id: 9003,
    reviewerId: 57,
    taskId: 5020,
    taskName: 'Реализовать ретраи интеграций',
    project: { id: 1009, name: 'Spring Integrations Gateway' },
    organization: { id: 303, name: 'Spring Guild' },
    author: { id: 26, login: 'sveta_back' },
    uploadedAt: daysFromNow(-7, 10, 5),
    responseDeadline: daysFromNow(-2, 17, 30),
    status: REVIEW_STATUS.COMPLETED,
    commentsCount: 11,
    checkedByReviewer: true,
    reviewedAt: daysFromNow(-2, 12, 10),
    revealAuthorAfterReview: true
  },
  {
    id: 9004,
    reviewerId: 57,
    taskId: 5017,
    taskName: 'Проставить микроразметку',
    project: { id: 1007, name: 'Pixel Forge Landing' },
    organization: { id: 302, name: 'Pixel Forge' },
    author: { id: 28, login: 'nina_ui' },
    uploadedAt: daysFromNow(-1, 9, 35),
    responseDeadline: daysFromNow(4, 15, 0),
    status: REVIEW_STATUS.IN_PROGRESS,
    commentsCount: 2,
    checkedByReviewer: true,
    reviewedAt: daysFromNow(-1, 18, 0),
    revealAuthorAfterReview: false
  },
  {
    id: 9005,
    reviewerId: 57,
    taskId: 6001,
    taskName: 'Сверстать адаптивную таблицу лидеров',
    project: { id: 1201, name: 'Frontend Guild Challenge' },
    organization: null,
    author: { id: 11, login: 'kate_west' },
    uploadedAt: daysFromNow(-3, 16, 10),
    responseDeadline: daysFromNow(2, 13, 0),
    status: REVIEW_STATUS.NEW,
    commentsCount: 0,
    checkedByReviewer: false,
    reviewedAt: null,
    revealAuthorAfterReview: true
  },
  {
    id: 9006,
    reviewerId: 57,
    taskId: 6002,
    taskName: 'Перевести форму на react-hook-form',
    project: { id: 1201, name: 'Frontend Guild Challenge' },
    organization: null,
    author: { id: 20, login: 'vera_arch' },
    uploadedAt: daysFromNow(-6, 13, 40),
    responseDeadline: daysFromNow(-3, 18, 0),
    status: REVIEW_STATUS.COMPLETED,
    commentsCount: 5,
    checkedByReviewer: true,
    reviewedAt: daysFromNow(-4, 12, 20),
    revealAuthorAfterReview: true
  },
  {
    id: 9007,
    reviewerId: 57,
    taskId: 6003,
    taskName: 'Оптимизировать bundle после code splitting',
    project: { id: 1202, name: 'UI Kit Lab' },
    organization: null,
    author: { id: 18, login: 'sasha_qa' },
    uploadedAt: daysFromNow(-1, 20, 5),
    responseDeadline: daysFromNow(5, 11, 30),
    status: REVIEW_STATUS.NEW,
    commentsCount: 0,
    checkedByReviewer: false,
    reviewedAt: null,
    revealAuthorAfterReview: false
  }
];

export const REVIEWS_PAGE_SIZE_DEFAULT = 20;
export const REVIEWS_NETWORK_DELAY_MS = 300;
export { DAY_MS };

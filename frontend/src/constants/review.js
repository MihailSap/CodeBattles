export const REVIEW_STATUS = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};

export const REVIEW_STATUS_LABEL = {
  [REVIEW_STATUS.NEW]: 'Новое',
  [REVIEW_STATUS.IN_PROGRESS]: 'В работе',
  [REVIEW_STATUS.COMPLETED]: 'Завершено'
};

export const REVIEW_SORT = {
  NEAREST_FIRST: 'NEAREST_FIRST',
  FARTHEST_FIRST: 'FARTHEST_FIRST'
};

export const REVIEW_SORT_LABEL = {
  [REVIEW_SORT.NEAREST_FIRST]: 'Сначала ближайшие',
  [REVIEW_SORT.FARTHEST_FIRST]: 'Сначала дальнейшие'
};

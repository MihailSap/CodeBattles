export const LEADERBOARD_SCOPE = {
  GLOBAL: 'global',
  ORGANIZATIONS: 'organizations',
  PROJECTS: 'projects'
};

export const LEADERBOARD_PERIOD = {
  ALL_TIME: 'allTime',
  DAYS_30: 'days30',
  DAYS_7: 'days7'
};

export const LEADERBOARD_CATEGORY = {
  OVERALL: 'overall',
  SOLUTIONS: 'solutions',
  REVIEWS: 'reviews',
  ACTIVITY: 'activity'
};

export const LEADERBOARD_TABS = [
  { key: LEADERBOARD_SCOPE.GLOBAL, label: 'Общий' },
  { key: LEADERBOARD_SCOPE.ORGANIZATIONS, label: 'По организациям' },
  { key: LEADERBOARD_SCOPE.PROJECTS, label: 'По проектам' }
];

export const LEADERBOARD_PERIOD_OPTIONS = [
  { key: LEADERBOARD_PERIOD.ALL_TIME, label: 'Все время' },
  { key: LEADERBOARD_PERIOD.DAYS_30, label: '30 дней' },
  { key: LEADERBOARD_PERIOD.DAYS_7, label: '7 дней' }
];

export const LEADERBOARD_CATEGORY_OPTIONS = [
  { key: LEADERBOARD_CATEGORY.OVERALL, label: 'Общий рейтинг' },
  { key: LEADERBOARD_CATEGORY.SOLUTIONS, label: 'Качество решений' },
  { key: LEADERBOARD_CATEGORY.REVIEWS, label: 'Качество ревью' },
  { key: LEADERBOARD_CATEGORY.ACTIVITY, label: 'Активность' }
];

export const LEADERBOARD_METRIC_COLUMNS = {
  [LEADERBOARD_CATEGORY.OVERALL]: [
    { key: 'totalRating', label: 'Общий рейтинг', type: 'number' },
    { key: 'codeQuality', label: 'Качество кода', type: 'number' },
    { key: 'aiCodeQuality', label: 'Качество кода (ИИ)', type: 'number' },
    { key: 'aiReviewQuality', label: 'Качество ревью (ИИ)', type: 'number' }
  ],
  [LEADERBOARD_CATEGORY.SOLUTIONS]: [
    { key: 'codeQuality', label: 'Качество кода', type: 'number' },
    { key: 'aiCodeQuality', label: 'Качество кода (ИИ)', type: 'number' },
    { key: 'fixedCommentsPercent', label: 'Исправленные замечания', type: 'percent' }
  ],
  [LEADERBOARD_CATEGORY.REVIEWS]: [
    { key: 'aiReviewQuality', label: 'Качество ревью (ИИ)', type: 'number' },
    { key: 'likesCount', label: 'Количество лайков', type: 'integer' },
    { key: 'reviewDepthPercent', label: 'Глубина ревью', type: 'percent' }
  ],
  [LEADERBOARD_CATEGORY.ACTIVITY]: [
    { key: 'totalRating', label: 'Общий рейтинг', type: 'number' },
    { key: 'completedReviewsCount', label: 'Кол-во выполненных ревью', type: 'integer' },
    { key: 'completedTasksCount', label: 'Кол-во выполненных задач', type: 'integer' }
  ]
};

export const LEADERBOARD_SORT_METRIC = {
  [LEADERBOARD_CATEGORY.OVERALL]: 'totalRating',
  [LEADERBOARD_CATEGORY.SOLUTIONS]: 'codeQuality',
  [LEADERBOARD_CATEGORY.REVIEWS]: 'aiReviewQuality',
  [LEADERBOARD_CATEGORY.ACTIVITY]: 'totalRating'
};

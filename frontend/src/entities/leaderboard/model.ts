export const LEADERBOARD_SCOPE = {
  GLOBAL: 'global',
  ORGANIZATIONS: 'organizations',
  PROJECTS: 'projects',
} as const;
export type LeaderboardScope = (typeof LEADERBOARD_SCOPE)[keyof typeof LEADERBOARD_SCOPE];
export const LEADERBOARD_PERIOD = {
  ALL_TIME: 'ALL_TIME',
  DAYS_30: 'DAYS_30',
  DAYS_7: 'DAYS_7',
} as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIOD)[keyof typeof LEADERBOARD_PERIOD];
export const LEADERBOARD_CATEGORY = {
  OVERALL: 'OVERALL',
  SOLUTIONS: 'SOLUTIONS',
  REVIEWS: 'REVIEWS',
  ACTIVITY: 'ACTIVITY',
} as const;
export type LeaderboardCategory = (typeof LEADERBOARD_CATEGORY)[keyof typeof LEADERBOARD_CATEGORY];
export const LEADERBOARD_TABS = [
  {
    key: LEADERBOARD_SCOPE.GLOBAL,
    label: 'Общий',
  },
  {
    key: LEADERBOARD_SCOPE.ORGANIZATIONS,
    label: 'По организациям',
  },
  {
    key: LEADERBOARD_SCOPE.PROJECTS,
    label: 'По проектам',
  },
] as const;
export const LEADERBOARD_PERIOD_OPTIONS = [
  {
    key: LEADERBOARD_PERIOD.ALL_TIME,
    label: 'Все время',
  },
  {
    key: LEADERBOARD_PERIOD.DAYS_30,
    label: '30 дней',
  },
  {
    key: LEADERBOARD_PERIOD.DAYS_7,
    label: '7 дней',
  },
] as const;
export const LEADERBOARD_CATEGORY_OPTIONS = [
  {
    key: LEADERBOARD_CATEGORY.OVERALL,
    label: 'Общий рейтинг',
  },
  {
    key: LEADERBOARD_CATEGORY.SOLUTIONS,
    label: 'Качество решений',
  },
  {
    key: LEADERBOARD_CATEGORY.REVIEWS,
    label: 'Качество ревью',
  },
  {
    key: LEADERBOARD_CATEGORY.ACTIVITY,
    label: 'Активность',
  },
] as const;
export const LEADERBOARD_METRIC_COLUMNS = {
  [LEADERBOARD_CATEGORY.OVERALL]: [
    {
      key: 'totalRating',
      label: 'Общий рейтинг',
      type: 'number',
    },
    {
      key: 'codeQuality',
      label: 'Качество кода',
      type: 'number',
    },
    {
      key: 'aiCodeQuality',
      label: 'Качество кода (ИИ)',
      type: 'number',
    },
    {
      key: 'aiReviewQuality',
      label: 'Качество ревью (ИИ)',
      type: 'number',
    },
  ],
  [LEADERBOARD_CATEGORY.SOLUTIONS]: [
    {
      key: 'codeQuality',
      label: 'Качество кода',
      type: 'number',
    },
    {
      key: 'aiCodeQuality',
      label: 'Качество кода (ИИ)',
      type: 'number',
    },
    {
      key: 'fixedCommentsPercent',
      label: 'Исправленные замечания',
      type: 'percent',
    },
  ],
  [LEADERBOARD_CATEGORY.REVIEWS]: [
    {
      key: 'aiReviewQuality',
      label: 'Качество ревью (ИИ)',
      type: 'number',
    },
    {
      key: 'likesCount',
      label: 'Количество лайков',
      type: 'integer',
    },
    {
      key: 'reviewDepthPercent',
      label: 'Глубина ревью',
      type: 'percent',
    },
  ],
  [LEADERBOARD_CATEGORY.ACTIVITY]: [
    {
      key: 'totalRating',
      label: 'Общий рейтинг',
      type: 'number',
    },
    {
      key: 'completedReviewsCount',
      label: 'Кол-во выполненных ревью',
      type: 'integer',
    },
    {
      key: 'completedTasksCount',
      label: 'Кол-во выполненных задач',
      type: 'integer',
    },
  ],
} as const;
export type LeaderboardMetricKey = (typeof LEADERBOARD_METRIC_COLUMNS)[LeaderboardCategory][number]['key'];
export type LeaderboardMetricDisplayType = (typeof LEADERBOARD_METRIC_COLUMNS)[LeaderboardCategory][number]['type'];
export const LEADERBOARD_SORT_METRIC = {
  [LEADERBOARD_CATEGORY.OVERALL]: 'totalRating',
  [LEADERBOARD_CATEGORY.SOLUTIONS]: 'codeQuality',
  [LEADERBOARD_CATEGORY.REVIEWS]: 'aiReviewQuality',
  [LEADERBOARD_CATEGORY.ACTIVITY]: 'totalRating',
} as const satisfies Record<LeaderboardCategory, LeaderboardMetricKey>;

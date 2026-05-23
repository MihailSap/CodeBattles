const avatarPool = [
  'https://img.freepik.com/premium-photo/young-stylish-guy-with-short-red-hair-dressed-blue-pullover-white-background_88135-55317.jpg',
  'https://img.freepik.com/premium-photo/young-blonde-caucasian-man_1368-502087.jpg',
  'https://img.freepik.com/free-psd/portrait-senior-man-old-age_23-2151685132.jpg',
  'https://img.freepik.com/free-psd/expressive-man-gesturing_23-2150198670.jpg',
  'https://img.freepik.com/free-photo/young-handsome-man-office-center_1303-19602.jpg',
  'https://img.freepik.com/free-photo/confused-shocked-guy-raising-eyebrows-standing-stupor_176420-19590.jpg',
  'https://img.freepik.com/free-photo/portrait-young-blonde-woman_273609-10447.jpg',
  'https://img.freepik.com/free-photo/beautiful-woman-portrait-garden_1328-1859.jpg',
  'https://img.freepik.com/free-photo/beautiful-portrait-teenager-woman_23-2149453399.jpg',
  'https://img.freepik.com/free-photo/portrait-young-girl-wearing-sunglasses-looking-cool_23-2149238391.jpg',
];

const firstNames = [
  'Александр',
  'Мария',
  'Дмитрий',
  'Анна',
  'Максим',
  'Екатерина',
  'Никита',
  'Виктория',
  'Иван',
  'София',
  'Артем',
  'Полина',
  'Кирилл',
  'Елена',
  'Роман',
  'Дарья',
  'Денис',
  'Ольга',
  'Сергей',
  'Алина',
];

const lastNames = [
  'Смирнов',
  'Иванова',
  'Кузнецов',
  'Попова',
  'Соколов',
  'Лебедева',
  'Козлов',
  'Новикова',
  'Морозов',
  'Петрова',
  'Волков',
  'Соловьева',
  'Васильев',
  'Зайцева',
  'Павлов',
  'Семенова',
  'Голубев',
  'Виноградова',
  'Богданов',
  'Федорова',
];

const middleNames = [
  'Андреевич',
  'Сергеевна',
  'Игоревич',
  'Олеговна',
  'Дмитриевич',
  'Романовна',
  'Павлович',
  'Алексеевна',
  'Викторович',
  'Максимовна',
];

export const MOCK_LEADERBOARD_ORGANIZATIONS = [
  {
    id: 1,
    name: 'CodeBattles Core',
    lastActivityAt: '2026-05-14T18:10:00.000Z',
  },
  {
    id: 2,
    name: 'Frontend Guild',
    lastActivityAt: '2026-05-13T15:30:00.000Z',
  },
  {
    id: 3,
    name: 'Review Masters',
    lastActivityAt: '2026-05-12T11:45:00.000Z',
  },
  {
    id: 4,
    name: 'Spring Lab',
    lastActivityAt: '2026-05-10T09:20:00.000Z',
  },
  {
    id: 5,
    name: 'AI Quality Crew',
    lastActivityAt: '2026-05-09T17:00:00.000Z',
  },
  {
    id: 6,
    name: 'Open Source Arena',
    lastActivityAt: '2026-05-07T12:00:00.000Z',
  },
  {
    id: 7,
    name: 'Mobile Practice',
    lastActivityAt: '2026-05-05T16:40:00.000Z',
  },
  {
    id: 8,
    name: 'Data Engineering Hub',
    lastActivityAt: '2026-05-03T10:15:00.000Z',
  },
];
export const MOCK_LEADERBOARD_PROJECTS = [
  {
    id: 1,
    organizationId: 1,
    name: 'Battle Platform',
    lastActivityAt: '2026-05-14T20:15:00.000Z',
  },
  {
    id: 2,
    organizationId: 1,
    name: 'Review Analytics',
    lastActivityAt: '2026-05-13T18:35:00.000Z',
  },
  {
    id: 3,
    organizationId: 2,
    name: 'Design System',
    lastActivityAt: '2026-05-12T13:25:00.000Z',
  },
  {
    id: 4,
    organizationId: 2,
    name: 'Frontend Toolkit',
    lastActivityAt: '2026-05-11T21:10:00.000Z',
  },
  {
    id: 5,
    organizationId: 3,
    name: 'Quality Radar',
    lastActivityAt: '2026-05-10T14:50:00.000Z',
  },
  {
    id: 6,
    organizationId: 4,
    name: 'Spring Gateway',
    lastActivityAt: '2026-05-09T16:15:00.000Z',
  },
  {
    id: 7,
    organizationId: 5,
    name: 'AI Reviewer',
    lastActivityAt: '2026-05-08T19:45:00.000Z',
  },
  {
    id: 8,
    organizationId: 6,
    name: 'Community Tasks',
    lastActivityAt: '2026-05-06T12:30:00.000Z',
  },
  {
    id: 9,
    organizationId: 7,
    name: 'Mobile Review',
    lastActivityAt: '2026-05-04T17:05:00.000Z',
  },
  {
    id: 10,
    organizationId: 8,
    name: 'Data Checks',
    lastActivityAt: '2026-05-02T08:40:00.000Z',
  },
];

const getMemberships = (id: LegacyValue) => {
  if (id === 57) {
    return {
      organizationIds: [1, 2, 3, 5, 6, 8],
      projectIds: [1, 2, 3, 5, 7, 8, 10],
    };
  }

  const organizationIds = [
    (id % MOCK_LEADERBOARD_ORGANIZATIONS.length) + 1,
    ((id + 2) % MOCK_LEADERBOARD_ORGANIZATIONS.length) + 1,
  ];

  const projectIds = [(id % MOCK_LEADERBOARD_PROJECTS.length) + 1, ((id + 3) % MOCK_LEADERBOARD_PROJECTS.length) + 1];

  if (id <= 105) {
    organizationIds.push(1);
    projectIds.push(1);
  }

  return {
    organizationIds: [...new Set(organizationIds)],
    projectIds: [...new Set(projectIds)],
  };
};

const toFixedNumber = (value: LegacyValue) => Number(value.toFixed(2));

const createStats = (id: LegacyValue, index: LegacyValue, periodMultiplier: LegacyValue) => {
  const isCurrentMockUser = id === 57;
  const ratingBase = isCurrentMockUser ? 6 : 2450 - index * 13;
  const qualityBase = isCurrentMockUser ? 1.7 : 5 - index * 0.011;
  const reviewBase = isCurrentMockUser ? 1.5 : 4.96 - index * 0.012;
  const activityBase = isCurrentMockUser ? 1 : 210 - index;

  return {
    totalRating: toFixedNumber(Math.max(0, ratingBase * periodMultiplier)),
    codeQuality: toFixedNumber(Math.max(1, qualityBase - (1 - periodMultiplier) * 0.18)),
    aiCodeQuality: toFixedNumber(Math.max(1, qualityBase - 0.07 - (index % 6) * 0.01)),
    fixedCommentsPercent: Math.max(
      0,
      Math.min(
        100,
        Math.round((isCurrentMockUser ? 18 : 98 - index * 0.38) * periodMultiplier + (1 - periodMultiplier) * 12)
      )
    ),
    aiReviewQuality: toFixedNumber(Math.max(1, reviewBase - (1 - periodMultiplier) * 0.12)),
    likesCount: Math.max(0, Math.round((isCurrentMockUser ? 0 : 360 - index * 2.6) * periodMultiplier)),
    reviewDepthPercent: Math.max(
      0,
      Math.min(
        100,
        Math.round((isCurrentMockUser ? 22 : 99 - index * 0.33) * periodMultiplier + (1 - periodMultiplier) * 15)
      )
    ),
    completedReviewsCount: Math.max(0, Math.round(activityBase * periodMultiplier)),
    completedTasksCount: Math.max(0, Math.round((isCurrentMockUser ? 1 : 190 - index * 0.9) * periodMultiplier)),
  };
};

export const MOCK_LEADERBOARD_USERS = Array.from(
  {
    length: 120,
  },
  (_: LegacyValue, index: LegacyValue) => {
    const id = index + 1;
    const memberships = getMemberships(id);
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const middleName = middleNames[index % middleNames.length];
    const name = id === 57 ? 'Муравьев Илья Германович' : `${lastName} ${firstName} ${middleName}`;

    return {
      id,
      name,
      login: id === 57 ? 'imimorgo5' : `code_player_${String(id).padStart(3, '0')}`,
      avatar: avatarPool[index % avatarPool.length],
      organizationIds: memberships.organizationIds,
      projectIds: memberships.projectIds,
      stats: {
        allTime: createStats(id, index, 1),
        days30: createStats(id, index, 0.34),
        days7: createStats(id, index, 0.11),
      },
    };
  }
);

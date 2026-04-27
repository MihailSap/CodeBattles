import { SKILL_GROUPS } from '../constants/profileSkills';
import {
  ACCESS_ERROR_CODE,
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIVACY,
  TASK_REVIEW_TYPE,
  TASK_STATUS
} from '../constants/project';

const withDelay = (value, ms = 450) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

const withDelayReject = (error, ms = 450) =>
  new Promise((_, reject) => {
    setTimeout(() => reject(error), ms);
  });

const clone = (value) => JSON.parse(JSON.stringify(value));

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
  'https://img.freepik.com/free-photo/portrait-young-girl-wearing-sunglasses-looking-cool_23-2149238391.jpg'
];

const organizationLogoPool = [
  'https://img.freepik.com/free-vector/abstract-company-logo_53876-120501.jpg',
  'https://img.freepik.com/free-vector/universal-logo-geometric-abstract-shape-design-template_126523-489.jpg',
  'https://img.freepik.com/free-vector/digital-co-modern-gradient-logo-design_779267-3078.jpg',
  'https://img.freepik.com/free-vector/flat-design-vs-logo-design_23-2149482034.jpg',
  'https://img.freepik.com/premium-vector/creative-elegant-abstract-minimalistic-logo-design-vector-any-brand-company_1253202-136889.jpg'
];

const allSkills = SKILL_GROUPS.flatMap((group) => group.options);

const pickStack = (indexes) => indexes.map((index) => allSkills[index % allSkills.length]).sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }));

const USERS = [
  { id: 57, login: 'imimorgo5', email: 'ilyamuravyov@mail.ru', fullName: 'Муравьев Илья Германович', avatar: avatarPool[0] },
  { id: 11, login: 'kate_west', email: 'kate.west@mail.ru', fullName: 'Кузнецова Екатерина Андреевна', avatar: avatarPool[1] },
  { id: 12, login: 'alexr', email: 'alex.r@mail.ru', fullName: 'Романов Александр Сергеевич', avatar: avatarPool[2] },
  { id: 13, login: 'nikita_dev', email: 'nikita.dev@mail.ru', fullName: 'Волков Никита Романович', avatar: avatarPool[3] },
  { id: 14, login: 'lina_code', email: 'lina.code@mail.ru', fullName: 'Петрова Алина Олеговна', avatar: avatarPool[4] },
  { id: 15, login: 'max_core', email: 'max.core@mail.ru', fullName: 'Соколов Максим Дмитриевич', avatar: avatarPool[5] },
  { id: 16, login: 'olga_ui', email: 'olga.ui@mail.ru', fullName: 'Климова Ольга Николаевна', avatar: avatarPool[6] },
  { id: 17, login: 'denis_ml', email: 'denis.ml@mail.ru', fullName: 'Исаев Денис Артемович', avatar: avatarPool[7] },
  { id: 18, login: 'sasha_qa', email: 'sasha.qa@mail.ru', fullName: 'Федорова Александра Павловна', avatar: avatarPool[8] },
  { id: 19, login: 'tim_ops', email: 'tim.ops@mail.ru', fullName: 'Зорин Тимур Андреевич', avatar: avatarPool[9] },
  { id: 20, login: 'vera_arch', email: 'vera.arch@mail.ru', fullName: 'Борисова Вера Ильинична', avatar: avatarPool[0] },
  { id: 21, login: 'igor_api', email: 'igor.api@mail.ru', fullName: 'Павлов Игорь Евгеньевич', avatar: avatarPool[2] },
  { id: 22, login: 'mira_pm', email: 'mira.pm@mail.ru', fullName: 'Лебедева Мира Аркадьевна', avatar: avatarPool[6] },
  { id: 23, login: 'artem_data', email: 'artem.data@mail.ru', fullName: 'Громов Артем Олегович', avatar: avatarPool[5] },
  { id: 24, login: 'yana_cloud', email: 'yana.cloud@mail.ru', fullName: 'Киреенко Яна Алексеевна', avatar: avatarPool[7] },
  { id: 25, login: 'roman_mobile', email: 'roman.mobile@mail.ru', fullName: 'Кравцов Роман Игоревич', avatar: avatarPool[4] },
  { id: 26, login: 'sveta_back', email: 'sveta.back@mail.ru', fullName: 'Мельникова Светлана Викторовна', avatar: avatarPool[8] },
  { id: 27, login: 'kirill_sec', email: 'kirill.sec@mail.ru', fullName: 'Тихонов Кирилл Сергеевич', avatar: avatarPool[3] },
  { id: 28, login: 'nina_ui', email: 'nina.ui@mail.ru', fullName: 'Дорофеева Нина Валерьевна', avatar: avatarPool[9] }
];

const organizations = {
  300: {
    id: 300,
    name: 'CodeBattles Team',
    logoUrl: organizationLogoPool[0],
    link: 'https://codebattles.team/organization/codebattles-team',
    description: 'Команда продукта CodeBattles: развиваем платформу ревью и командных инженерных баттлов.',
    ownerId: 57
  },
  301: {
    id: 301,
    name: 'DevCore Group',
    logoUrl: organizationLogoPool[1],
    link: 'https://codebattles.team/organization/devcore-group',
    description: 'Инженерная группа, фокус на внутренних инструментах, CI/CD и стабильности релизов.',
    ownerId: 15
  },
  302: {
    id: 302,
    name: 'Pixel Forge',
    logoUrl: organizationLogoPool[2],
    link: 'https://codebattles.team/organization/pixel-forge',
    description: 'Кросс-функциональная студия интерфейсов и продуктовой аналитики.',
    ownerId: 57
  },
  303: {
    id: 303,
    name: 'Spring Guild',
    logoUrl: organizationLogoPool[3],
    link: 'https://codebattles.team/organization/spring-guild',
    description: 'Сообщество backend-разработчиков для Java и интеграционных сервисов.',
    ownerId: 12
  },
  304: {
    id: 304,
    name: 'Cloud Harbor',
    logoUrl: organizationLogoPool[4],
    link: 'https://codebattles.team/organization/cloud-harbor',
    description: 'Платформа облачной инфраструктуры, мониторинга и DevOps-практик.',
    ownerId: 22
  },
  305: {
    id: 305,
    name: 'Data North',
    logoUrl: organizationLogoPool[1],
    link: 'https://codebattles.team/organization/data-north',
    description: 'Команда анализа данных и экспериментальных продуктовых гипотез.',
    ownerId: 24
  },
  306: {
    id: 306,
    name: 'Frontend Guild RU',
    logoUrl: organizationLogoPool[3],
    link: 'https://codebattles.team/organization/frontend-guild-ru',
    description: 'Организация для экспериментов с интерфейсами и практиками фронтенд-разработки.',
    ownerId: 57
  }
};

const organizationMembers = {
  300: [57, 11, 12, 13, 14, 16, 20],
  301: [15, 17, 18, 19, 21],
  302: [57, 16, 22, 23, 28],
  303: [12, 57, 25, 26, 27],
  304: [22, 23, 24, 28],
  305: [24, 26, 27],
  306: [57]
};

const makeDate = (daysFromNow, hours = 10, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const mockState = {
  projects: [
    {
      id: 1001,
      organizationId: 300,
      name: 'CodeBattles Front Platform',
      description: 'Платформа для проведения баттлов и ревью решений в команде. Фронтенд и бэкенд разрабатываются параллельно, с акцентом на UX и качество кода.',
      stack: pickStack([3, 4, 6, 9, 10, 17, 20]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/codebattles/front-platform',
      participants: [
        { userId: 57, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 11, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 12, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 14, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 16, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 20, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5001, 5002, 5003, 5004, 5005],
      lastActivityAt: makeDate(0, 13, 20)
    },
    {
      id: 1002,
      organizationId: null,
      name: 'UI Kit Lab',
      description: 'Эксперименты с дизайн-системой, визуальными паттернами и доступностью.',
      stack: pickStack([3, 4, 11, 13, 16]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: true,
      repositoryUrl: 'https://gitlab.com/ui-kit-lab/project',
      participants: [
        { userId: 16, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 57, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 18, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5006, 5007],
      lastActivityAt: makeDate(-1, 17, 30)
    },
    {
      id: 1003,
      organizationId: 300,
      name: 'Enterprise Security Console',
      description: 'Приватный проект для внутренней панели безопасности и управления доступами.',
      stack: pickStack([1, 6, 8, 19, 22, 24]),
      privacy: PROJECT_PRIVACY.PRIVATE,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/private/security-console',
      participants: [
        { userId: 12, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 57, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 11, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 14, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5008, 5009, 5010, 5011],
      lastActivityAt: makeDate(-2, 11, 0)
    },
    {
      id: 1004,
      organizationId: null,
      name: 'Pet Analytics Dashboard',
      description: 'Публичный pet-проект с аналитикой, метриками и графиками в реальном времени.',
      stack: pickStack([3, 4, 10, 15, 26]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: false,
      repositoryUrl: 'https://github.com/pet/analytics-dashboard',
      participants: [
        { userId: 19, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 15, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 17, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5012],
      lastActivityAt: makeDate(-8, 19, 15)
    },
    {
      id: 1005,
      organizationId: 301,
      name: 'DevCore Internal Tools',
      description: 'Набор внутренних инструментов для автоматизации CI/CD и рутинных процессов.',
      stack: pickStack([6, 10, 18, 19, 20, 22]),
      privacy: PROJECT_PRIVACY.PRIVATE,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/devcore/internal-tools',
      participants: [
        { userId: 15, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 17, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 19, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 21, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5013, 5014, 5015],
      lastActivityAt: makeDate(-20, 10, 45)
    },
    {
      id: 1006,
      organizationId: null,
      name: 'Open Source Starter',
      description: '',
      stack: pickStack([3, 6, 10, 17]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: false,
      repositoryUrl: '',
      participants: [
        { userId: 13, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 57, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 18, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 20, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [],
      lastActivityAt: makeDate(-120, 12, 0)
    },
    {
      id: 1007,
      organizationId: 302,
      name: 'Pixel Forge Landing',
      description: 'Промо-лендинг продуктовой студии с акцентом на анимации, доступность и SEO.',
      stack: pickStack([3, 4, 6, 10, 16]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/pixel-forge/landing',
      participants: [
        { userId: 57, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 16, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 28, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5016, 5017],
      lastActivityAt: makeDate(-3, 14, 10)
    },
    {
      id: 1008,
      organizationId: 302,
      name: 'Design Tokens Hub',
      description: 'Приватный репозиторий токенов и синхронизации тем между вебом и мобильными клиентами.',
      stack: pickStack([3, 10, 13, 19, 24]),
      privacy: PROJECT_PRIVACY.PRIVATE,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/pixel-forge/design-tokens-hub',
      participants: [
        { userId: 16, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 57, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 22, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5018],
      lastActivityAt: makeDate(-5, 12, 5)
    },
    {
      id: 1009,
      organizationId: 303,
      name: 'Spring Integrations Gateway',
      description: 'Публичный проект интеграционного шлюза для сервисов команды с единым контрактом API.',
      stack: pickStack([1, 6, 18, 20, 22]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/spring-guild/integrations-gateway',
      participants: [
        { userId: 12, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 57, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 26, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 27, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5019, 5020],
      lastActivityAt: makeDate(-1, 9, 50)
    },
    {
      id: 1010,
      organizationId: 303,
      name: 'Audit Streams Service',
      description: 'Приватный сервис потокового аудита операций с поддержкой SLA и ретраев.',
      stack: pickStack([1, 6, 19, 20, 25]),
      privacy: PROJECT_PRIVACY.PRIVATE,
      aiReviewEnabled: false,
      repositoryUrl: 'https://github.com/spring-guild/audit-streams-service',
      participants: [
        { userId: 26, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 12, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 25, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5021],
      lastActivityAt: makeDate(-14, 18, 20)
    },
    {
      id: 1011,
      organizationId: null,
      name: 'Personal Architecture Notes',
      description: 'Закрытый проект с архитектурными заметками, схемами и внутренними RFC.',
      stack: pickStack([6, 10, 19, 23]),
      privacy: PROJECT_PRIVACY.PRIVATE,
      aiReviewEnabled: false,
      repositoryUrl: '',
      participants: [
        { userId: 57, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 11, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5022],
      lastActivityAt: makeDate(-2, 20, 45)
    },
    {
      id: 1012,
      organizationId: null,
      name: 'Community UI Playground',
      description: 'Публичная песочница для экспериментов с UI-компонентами и паттернами состояний.',
      stack: pickStack([3, 4, 10, 15, 16]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/community/ui-playground',
      participants: [
        { userId: 22, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 28, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 24, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [5023],
      lastActivityAt: makeDate(-6, 10, 15)
    },
    {
      id: 1013,
      organizationId: 304,
      name: 'Cloud Harbor Observability',
      description: 'Набор дашбордов и алертов для мониторинга прод-сервисов и анализа инцидентов.',
      stack: pickStack([6, 18, 19, 20, 26]),
      privacy: PROJECT_PRIVACY.PUBLIC,
      aiReviewEnabled: true,
      repositoryUrl: 'https://github.com/cloud-harbor/observability',
      participants: [
        { userId: 22, role: PROJECT_MEMBER_ROLE.OWNER },
        { userId: 23, role: PROJECT_MEMBER_ROLE.MEMBER },
        { userId: 24, role: PROJECT_MEMBER_ROLE.MEMBER }
      ],
      taskIds: [],
      lastActivityAt: makeDate(-30, 11, 30)
    }
  ],
  tasks: [
    { id: 5001, projectId: 1001, name: 'Сверстать главную страницу проекта', description: 'Сделать адаптивную вёрстку блока общей информации.', requirements: 'Pixel-perfect, mobile-first', evaluationCriteria: 'Все состояния покрыты', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(1, 18, 0), reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES, assigneeIds: [57, 11] },
    { id: 5002, projectId: 1001, name: 'Подключить redux-состояние фильтров', description: 'Слайс + селекторы + мемоизация', requirements: 'Избежать лишних ререндеров', evaluationCriteria: 'Стабильные селекторы', status: TASK_STATUS.REWORK, deadline: makeDate(2, 12, 0), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [12] },
    { id: 5003, projectId: 1001, name: 'Реализовать табы страницы проекта', description: 'С анимированным активным индикатором', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_REVIEW, deadline: makeDate(4, 14, 30), reviewType: TASK_REVIEW_TYPE.AI_ONLY, assigneeIds: [14, 16] },
    { id: 5004, projectId: 1001, name: 'Оптимизировать рендер таблицы задач', description: 'Добавить батчинг и виртуализацию при необходимости', requirements: '', evaluationCriteria: '', status: TASK_STATUS.DONE, deadline: makeDate(5, 16, 0), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [20] },
    { id: 5005, projectId: 1001, name: 'Сделать модальное окно приглашений', description: 'С копированием ссылки', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(3, 11, 30), reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES, assigneeIds: [57, 12, 16] },
    { id: 5006, projectId: 1002, name: 'Собрать палитру компонентов', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(6, 19, 0), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [16] },
    { id: 5007, projectId: 1002, name: 'Протестировать контрастность', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.DONE, deadline: makeDate(9, 10, 0), reviewType: TASK_REVIEW_TYPE.AI_ONLY, assigneeIds: [18, 57] },
    { id: 5008, projectId: 1003, name: 'Добавить аудит действий', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_REVIEW, deadline: makeDate(1, 15, 0), reviewType: TASK_REVIEW_TYPE.AUTO_ORGANIZATION, assigneeIds: [12, 57] },
    { id: 5009, projectId: 1003, name: 'Ролевой доступ в настройках', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.REWORK, deadline: makeDate(2, 17, 45), reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES, assigneeIds: [11] },
    { id: 5010, projectId: 1003, name: 'Скрыть приватные поля для гостей', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(3, 18, 15), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [14, 57] },
    { id: 5011, projectId: 1003, name: 'Добавить smoke-тест авторизации', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.DONE, deadline: makeDate(7, 12, 30), reviewType: TASK_REVIEW_TYPE.AI_ONLY, assigneeIds: [12] },
    { id: 5012, projectId: 1004, name: 'Нарисовать график активности', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(5, 9, 0), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [19, 15] },
    { id: 5013, projectId: 1005, name: 'Скрипт авто-сборки артефактов', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_REVIEW, deadline: makeDate(10, 13, 0), reviewType: TASK_REVIEW_TYPE.AUTO_ORGANIZATION, assigneeIds: [15] },
    { id: 5014, projectId: 1005, name: 'Мониторинг загрузки раннеров', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.REWORK, deadline: makeDate(11, 16, 40), reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES, assigneeIds: [17, 21] },
    { id: 5015, projectId: 1005, name: 'Улучшить шаблон релизов', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.DONE, deadline: makeDate(15, 15, 20), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [19] },
    { id: 5016, projectId: 1007, name: 'Сделать hero-секцию с анимацией', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(3, 19, 30), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [57, 16] },
    { id: 5017, projectId: 1007, name: 'Проставить микроразметку', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_REVIEW, deadline: makeDate(6, 13, 0), reviewType: TASK_REVIEW_TYPE.AI_ONLY, assigneeIds: [28] },
    { id: 5018, projectId: 1008, name: 'Синхронизировать токены dark/light', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.REWORK, deadline: makeDate(4, 18, 0), reviewType: TASK_REVIEW_TYPE.AUTO_ORGANIZATION, assigneeIds: [22, 57] },
    { id: 5019, projectId: 1009, name: 'Добавить OpenAPI контракт', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(2, 15, 45), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [12] },
    { id: 5020, projectId: 1009, name: 'Реализовать ретраи интеграций', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.DONE, deadline: makeDate(7, 11, 0), reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES, assigneeIds: [26, 27] },
    { id: 5021, projectId: 1010, name: 'Оптимизировать аудит-очереди', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_REVIEW, deadline: makeDate(8, 17, 20), reviewType: TASK_REVIEW_TYPE.AUTO_ORGANIZATION, assigneeIds: [26] },
    { id: 5022, projectId: 1011, name: 'Описать паттерн модульности', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.IN_PROGRESS, deadline: makeDate(9, 20, 0), reviewType: TASK_REVIEW_TYPE.AI_ONLY, assigneeIds: [57] },
    { id: 5023, projectId: 1012, name: 'Собрать каталог карточек', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.REWORK, deadline: makeDate(5, 16, 30), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [22, 24] }
  ],
  invites: [],
  organizationInvites: [],
  organizationJoinRequests: [
    {
      id: 'org-request-300-25-seed',
      organizationId: 300,
      ownerId: 57,
      userId: 25,
      status: 'PENDING',
      createdAt: makeDate(-1, 10, 20)
    },
    {
      id: 'org-request-306-18-seed',
      organizationId: 306,
      ownerId: 57,
      userId: 18,
      status: 'PENDING',
      createdAt: makeDate(-2, 12, 5)
    }
  ]
};

let nextProjectId = 1100;
let nextTaskId = 5200;

const getUserById = (userId) => USERS.find((user) => user.id === userId) || null;

const getOrganization = (organizationId) => organizations[organizationId] || null;

const isOrganizationMember = (organizationId, userId) => {
  if (!organizationId) {
    return true;
  }

  return Boolean(organizationMembers[organizationId]?.includes(userId));
};

const getProjectParticipant = (project, userId) => project.participants.find((participant) => participant.userId === userId) || null;

const isProjectNameUnique = (projectName, organizationId, excludedProjectId = null) => {
  const normalizedName = projectName.trim().toLowerCase();

  return !mockState.projects.some((project) => {
    if (excludedProjectId && project.id === excludedProjectId) {
      return false;
    }

    const sameScope = organizationId ? project.organizationId === organizationId : !project.organizationId;

    if (!sameScope) {
      return false;
    }

    return project.name.trim().toLowerCase() === normalizedName;
  });
};

const getProjectTasks = (projectId) => mockState.tasks.filter((task) => task.projectId === projectId);

const getProjectForViewer = (projectId, viewerId) => {
  const project = mockState.projects.find((item) => item.id === Number(projectId));

  if (!project) {
    const error = new Error('Проект не найден');
    error.status = 404;
    throw error;
  }

  if (!isOrganizationMember(project.organizationId, viewerId)) {
    const error = new Error('Необходимо присоединиться к организации');
    error.status = 403;
    error.code = ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION;
    throw error;
  }

  const participant = getProjectParticipant(project, viewerId);

  if (project.privacy === PROJECT_PRIVACY.PRIVATE && !participant) {
    const error = new Error('Необходимо присоединиться к проекту');
    error.status = 403;
    error.code = ACCESS_ERROR_CODE.FORBIDDEN_PROJECT;
    throw error;
  }

  const viewerRole = participant?.role || PROJECT_MEMBER_ROLE.GUEST;
  const canSeeTasks = viewerRole !== PROJECT_MEMBER_ROLE.GUEST;

  return {
    project,
    viewerRole,
    canSeeTasks
  };
};

const materializeProject = (project, viewerRole, canSeeTasks) => {
  const organization = getOrganization(project.organizationId);
  const participants = project.participants
    .map((participant) => {
      const user = getUserById(participant.userId);

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        login: user.login,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: participant.role
      };
    })
    .filter(Boolean);

  const tasks = getProjectTasks(project.id).map((task) => ({
    ...task,
    assignees: task.assigneeIds
      .map((userId) => {
        const user = getUserById(userId);
        const role = project.participants.find((participant) => participant.userId === userId)?.role;

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          login: user.login,
          fullName: user.fullName,
          avatar: user.avatar,
          role: role || PROJECT_MEMBER_ROLE.MEMBER
        };
      })
      .filter(Boolean)
  }));

  return {
    id: project.id,
    organizationId: project.organizationId,
    organizationName: organization?.name || '',
    name: project.name,
    description: project.description,
    stack: clone(project.stack),
    privacy: project.privacy,
    aiReviewEnabled: project.aiReviewEnabled,
    repositoryUrl: project.repositoryUrl,
    participants,
    taskIds: clone(project.taskIds),
    lastActivityAt: project.lastActivityAt,
    viewerRole,
    canSeeTasks,
    tasks: canSeeTasks ? tasks : []
  };
};

const updateProjectLastActivity = (projectId) => {
  const projectIndex = mockState.projects.findIndex((project) => project.id === projectId);

  if (projectIndex < 0) {
    return;
  }

  mockState.projects[projectIndex].lastActivityAt = new Date().toISOString();
};

const makeInviteLink = (token, type = 'projects') => {
  const base = typeof window === 'undefined' ? '' : window.location.origin;
  return `${base}/${type}/join/${token}`;
};

const createInviteToken = () => `inv-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

const ORGANIZATION_MEMBER_ROLE = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER'
};

const sortByName = (left, right) => left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' });

const sortProjectsByViewerRole = (left, right, viewerId) => {
  const roleWeight = {
    [PROJECT_MEMBER_ROLE.OWNER]: 0,
    [PROJECT_MEMBER_ROLE.MEMBER]: 1,
    [PROJECT_MEMBER_ROLE.GUEST]: 2
  };
  const leftRole = getProjectParticipant(left, viewerId)?.role || PROJECT_MEMBER_ROLE.GUEST;
  const rightRole = getProjectParticipant(right, viewerId)?.role || PROJECT_MEMBER_ROLE.GUEST;
  const roleDiff = roleWeight[leftRole] - roleWeight[rightRole];

  if (roleDiff !== 0) {
    return roleDiff;
  }

  return sortByName(left, right);
};

const getOrganizationRoleForUser = (organizationId, userId) => {
  const organization = getOrganization(organizationId);

  if (!organization || !organizationMembers[organizationId]?.includes(userId)) {
    return null;
  }

  if (organization.ownerId === userId) {
    return ORGANIZATION_MEMBER_ROLE.OWNER;
  }

  return ORGANIZATION_MEMBER_ROLE.MEMBER;
};

const mapProjectListItem = (project, viewerId) => {
  const participant = getProjectParticipant(project, viewerId);

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    privacy: project.privacy,
    organizationId: project.organizationId,
    organizationName: getOrganization(project.organizationId)?.name || '',
    role: participant?.role || PROJECT_MEMBER_ROLE.GUEST,
    participantsCount: project.participants.length,
    openTasksCount: getProjectTasks(project.id).filter((task) => task.status !== TASK_STATUS.DONE).length,
    lastActivityAt: project.lastActivityAt
  };
};

const mapOrganizationListItem = (organizationId, viewerId) => {
  const organization = getOrganization(organizationId);
  const role = getOrganizationRoleForUser(organizationId, viewerId);
  const projectsCount = mockState.projects.filter((project) => project.organizationId === organizationId).length;

  return {
    id: organization.id,
    logo: organization.logoUrl,
    name: organization.name,
    link: organization.link,
    description: organization.description,
    role,
    participantsCount: organizationMembers[organizationId]?.length || 0,
    projectsCount
  };
};

const getProjectRoleForViewer = (project, viewerId) => {
  const participant = getProjectParticipant(project, viewerId);
  return participant?.role || PROJECT_MEMBER_ROLE.GUEST;
};

const getOrganizationParticipants = (organizationId) => {
  return (organizationMembers[organizationId] || [])
    .map((userId) => {
      const user = getUserById(userId);

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        login: user.login,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: getOrganizationRoleForUser(organizationId, user.id) || ORGANIZATION_MEMBER_ROLE.MEMBER
      };
    })
    .filter(Boolean);
};

const getOrganizationJoinRequests = (organizationId) => {
  return mockState.organizationJoinRequests
    .filter((request) => request.organizationId === organizationId && request.status === 'PENDING')
    .map((request) => {
      const user = getUserById(request.userId);

      if (!user) {
        return null;
      }

      return {
        id: request.id,
        userId: user.id,
        login: user.login,
        fullName: user.fullName,
        avatar: user.avatar,
        createdAt: request.createdAt
      };
    })
    .filter(Boolean);
};

const getOrganizationProjectsForViewer = (organizationId, viewerId) => {
  return mockState.projects
    .filter((project) => project.organizationId === organizationId)
    .map((project) => {
      const viewerRole = getProjectRoleForViewer(project, viewerId);
      const activeTasksCount = getProjectTasks(project.id).filter((task) => task.status !== TASK_STATUS.DONE).length;
      const participants = project.participants
        .map((participant) => {
          const user = getUserById(participant.userId);

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            login: user.login,
            fullName: user.fullName,
            avatar: user.avatar,
            role: participant.role
          };
        })
        .filter(Boolean);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        activeTasksCount,
        participants,
        viewerRole
      };
    });
};

const materializeOrganization = (organizationId, viewerId) => {
  const organization = getOrganization(organizationId);

  if (!organization) {
    const error = new Error('Организация не найдена');
    error.status = 404;
    throw error;
  }

  if (!isOrganizationMember(organizationId, viewerId)) {
    const error = new Error('Необходимо присоединиться к организации');
    error.status = 403;
    error.code = ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION;
    throw error;
  }

  return {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    link: organization.link,
    logoUrl: organization.logoUrl,
    ownerId: organization.ownerId,
    viewerRole: getOrganizationRoleForUser(organizationId, viewerId),
    participants: getOrganizationParticipants(organizationId),
    projects: getOrganizationProjectsForViewer(organizationId, viewerId),
    joinRequests: getOrganizationJoinRequests(organizationId)
  };
};

const isOrganizationNameUnique = (name, excludedOrganizationId = null) => {
  const normalizedName = name.trim().toLowerCase();

  return !Object.values(organizations).some((organization) => {
    if (!organization) {
      return false;
    }

    if (excludedOrganizationId && organization.id === excludedOrganizationId) {
      return false;
    }

    return organization.name.trim().toLowerCase() === normalizedName;
  });
};

const paginate = (items, page, pageSize) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 15);
  const startIndex = (safePage - 1) * safePageSize;
  const data = items.slice(startIndex, startIndex + safePageSize);

  return {
    data,
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    hasMore: startIndex + safePageSize < items.length
  };
};

export const projectsApi = {
  async getProjectUsers() {
    return withDelay(clone(USERS));
  },

  async getProjectsList(viewerId) {
    const visibleProjects = mockState.projects
      .filter((project) => {
        if (!isOrganizationMember(project.organizationId, viewerId)) {
          return false;
        }

        if (project.privacy === PROJECT_PRIVACY.PUBLIC) {
          return true;
        }

        return Boolean(getProjectParticipant(project, viewerId));
      })
      .map((project) => {
        const participant = getProjectParticipant(project, viewerId);

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          privacy: project.privacy,
          organizationId: project.organizationId,
          organizationName: getOrganization(project.organizationId)?.name || '',
          role: participant?.role || PROJECT_MEMBER_ROLE.GUEST,
          participantsCount: project.participants.length,
          openTasksCount: getProjectTasks(project.id).filter((task) => task.status !== TASK_STATUS.DONE).length,
          lastActivityAt: project.lastActivityAt
        };
      })
      .sort((left, right) => right.id - left.id);

    return withDelay(clone(visibleProjects));
  },

  async getProjectById(projectId, viewerId) {
    const { project, viewerRole, canSeeTasks } = getProjectForViewer(projectId, viewerId);

    return withDelay(materializeProject(project, viewerRole, canSeeTasks));
  },

  async createProject(payload) {
    const normalizedName = payload.name?.trim() || '';

    if (!isProjectNameUnique(normalizedName, payload.organizationId || null)) {
      const error = new Error('Проект с таким названием уже существует');
      error.status = 409;
      error.code = 'PROJECT_NAME_CONFLICT';
      return withDelayReject(error);
    }

    return withDelay({
      accepted: false,
      reason: 'NOT_IMPLEMENTED'
    });
  },

  async updateProject(projectId, payload) {
    const index = mockState.projects.findIndex((project) => project.id === Number(projectId));

    if (index < 0) {
      const error = new Error('Проект не найден');
      error.status = 404;
      return withDelayReject(error);
    }

    if (!isProjectNameUnique(payload.name, mockState.projects[index].organizationId, Number(projectId))) {
      const error = new Error('Проект с таким названием уже существует');
      error.status = 409;
      error.code = 'PROJECT_NAME_CONFLICT';
      return withDelayReject(error);
    }

    mockState.projects[index] = {
      ...mockState.projects[index],
      name: payload.name.trim(),
      description: payload.description || '',
      repositoryUrl: payload.repositoryUrl || '',
      stack: clone(payload.stack || []),
      privacy: payload.privacy,
      aiReviewEnabled: Boolean(payload.aiReviewEnabled)
    };

    updateProjectLastActivity(mockState.projects[index].id);

    return withDelay(clone(mockState.projects[index]));
  },

  async deleteProject(projectId) {
    const targetId = Number(projectId);
    mockState.projects = mockState.projects.filter((project) => project.id !== targetId);
    mockState.tasks = mockState.tasks.filter((task) => task.projectId !== targetId);
    mockState.invites = mockState.invites.filter((invite) => invite.projectId !== targetId);

    return withDelay({ deleted: true });
  },

  async createTask(projectId, payload) {
    if (!payload || !projectId) {
      const error = new Error('Не удалось создать задачу. Попробуйте позже');
      error.status = 500;
      return withDelayReject(error);
    }

    nextTaskId += 1;

    return withDelay({
      accepted: false,
      reason: 'NOT_IMPLEMENTED',
      taskId: nextTaskId
    });
  },

  async leaveProject(projectId, userId) {
    const index = mockState.projects.findIndex((project) => project.id === Number(projectId));

    if (index < 0) {
      const error = new Error('Проект не найден');
      error.status = 404;
      return withDelayReject(error);
    }

    const participant = getProjectParticipant(mockState.projects[index], userId);

    if (!participant) {
      return withDelay({ left: true });
    }

    if (participant.role === PROJECT_MEMBER_ROLE.OWNER) {
      const error = new Error('Владелец не может выйти из проекта');
      error.status = 400;
      return withDelayReject(error);
    }

    mockState.projects[index].participants = mockState.projects[index].participants.filter((item) => item.userId !== userId);
    updateProjectLastActivity(mockState.projects[index].id);

    return withDelay({ left: true });
  },

  async generateProjectInvite(projectId, payload) {
    const token = createInviteToken();
    const invite = {
      token,
      projectId: Number(projectId),
      expiresAt: payload.expiresAt,
      reusable: Boolean(payload.reusable),
      createdAt: new Date().toISOString()
    };

    mockState.invites.unshift(invite);

    return withDelay({
      token,
      link: makeInviteLink(token, 'projects'),
      ...clone(invite)
    });
  },

  async joinByInvite(token, userId) {
    const inviteIndex = mockState.invites.findIndex((invite) => invite.token === token);

    if (inviteIndex < 0) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    const invite = mockState.invites[inviteIndex];
    const projectIndex = mockState.projects.findIndex((project) => project.id === invite.projectId);

    if (projectIndex < 0) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      mockState.invites.splice(inviteIndex, 1);
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    const project = mockState.projects[projectIndex];

    if (!isOrganizationMember(project.organizationId, userId)) {
      const error = new Error('Необходимо присоединиться к организации');
      error.status = 403;
      error.code = ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION;
      return withDelayReject(error);
    }

    const existingMember = getProjectParticipant(project, userId);

    if (existingMember) {
      const error = new Error('Вы уже являетесь участником этого проекта');
      error.status = 409;
      error.code = ACCESS_ERROR_CODE.ALREADY_MEMBER;
      return withDelayReject(error);
    }

    mockState.projects[projectIndex].participants.push({
      userId,
      role: PROJECT_MEMBER_ROLE.MEMBER
    });

    if (!invite.reusable) {
      mockState.invites.splice(inviteIndex, 1);
    }

    updateProjectLastActivity(project.id);

    return withDelay({
      projectId: project.id,
      joined: true
    });
  },

  async getInviteInfo(token) {
    const invite = mockState.invites.find((item) => item.token === token);

    if (!invite) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    const project = mockState.projects.find((item) => item.id === invite.projectId);

    if (!project) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    return withDelay({
      projectId: project.id,
      projectName: project.name,
      organizationId: project.organizationId,
      expiresAt: invite.expiresAt,
      reusable: invite.reusable
    });
  },

  async generateOrganizationInvite(organizationId, payload) {
    const normalizedOrganizationId = Number(organizationId);
    const organization = getOrganization(normalizedOrganizationId);

    if (!organization) {
      const error = new Error('Организация не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    const token = createInviteToken();
    const invite = {
      token,
      organizationId: normalizedOrganizationId,
      expiresAt: payload.expiresAt,
      reusable: Boolean(payload.reusable),
      createdAt: new Date().toISOString()
    };

    mockState.organizationInvites.unshift(invite);

    return withDelay({
      token,
      link: makeInviteLink(token, 'organizations'),
      ...clone(invite)
    });
  },

  async joinOrganizationByInvite(token, userId) {
    const inviteIndex = mockState.organizationInvites.findIndex((invite) => invite.token === token);

    if (inviteIndex < 0) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    const invite = mockState.organizationInvites[inviteIndex];
    const organization = getOrganization(invite.organizationId);

    if (!organization) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      mockState.organizationInvites.splice(inviteIndex, 1);
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    if (isOrganizationMember(organization.id, userId)) {
      const error = new Error('Вы уже являетесь участником этой организации');
      error.status = 409;
      error.code = ACCESS_ERROR_CODE.ALREADY_MEMBER;
      return withDelayReject(error);
    }

    if (!organizationMembers[organization.id]) {
      organizationMembers[organization.id] = [];
    }

    organizationMembers[organization.id].push(userId);
    mockState.organizationJoinRequests = mockState.organizationJoinRequests.filter(
      (request) => !(request.organizationId === organization.id && request.userId === userId && request.status === 'PENDING')
    );

    if (!invite.reusable) {
      mockState.organizationInvites.splice(inviteIndex, 1);
    }

    return withDelay({
      organizationId: organization.id,
      joined: true
    });
  },

  async getOrganizationInviteInfo(token) {
    const invite = mockState.organizationInvites.find((item) => item.token === token);

    if (!invite) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    const organization = getOrganization(invite.organizationId);

    if (!organization) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      const error = new Error('Пригласительная ссылка недействительна или устарела');
      error.status = 400;
      error.code = ACCESS_ERROR_CODE.INVALID_INVITE;
      return withDelayReject(error);
    }

    return withDelay({
      organizationId: organization.id,
      organizationName: organization.name,
      expiresAt: invite.expiresAt,
      reusable: invite.reusable
    });
  },

  async getProjectsDashboard(viewerId) {
    const myOrganizations = Object.keys(organizationMembers)
      .map(Number)
      .filter((organizationId) => organizationMembers[organizationId]?.includes(viewerId))
      .sort((leftId, rightId) => sortByName(getOrganization(leftId), getOrganization(rightId)));

    const withoutOrganizationProjects = mockState.projects
      .filter((project) => !project.organizationId)
      .filter((project) => Boolean(getProjectParticipant(project, viewerId)))
      .sort((left, right) => sortProjectsByViewerRole(left, right, viewerId))
      .map((project) => mapProjectListItem(project, viewerId));

    const organizationsWithProjects = myOrganizations.map((organizationId) => {
      const organization = getOrganization(organizationId);
      const projects = mockState.projects
        .filter((project) => project.organizationId === organizationId)
        .sort((left, right) => sortProjectsByViewerRole(left, right, viewerId))
        .map((project) => mapProjectListItem(project, viewerId));

      return {
        id: organization.id,
        logo: organization.logoUrl,
        name: organization.name,
        link: organization.link,
        description: organization.description,
        role: getOrganizationRoleForUser(organizationId, viewerId),
        participants: clone(organizationMembers[organizationId] || []),
        projects
      };
    });

    return withDelay({
      withoutOrganizationProjects,
      organizationsWithProjects
    });
  },

  async getMyOrganizations(viewerId, params = {}) {
    const { page = 1, pageSize = 15 } = params;
    const source = Object.keys(organizationMembers)
      .map(Number)
      .filter((organizationId) => organizationMembers[organizationId]?.includes(viewerId))
      .map((organizationId) => mapOrganizationListItem(organizationId, viewerId))
      .sort((left, right) => {
        const leftPriority = left.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 0 : 1;
        const rightPriority = right.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 0 : 1;
        const priorityDiff = leftPriority - rightPriority;

        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' });
      });

    return withDelay(paginate(source, page, pageSize));
  },

  async getOrganizationById(organizationId, viewerId) {
    return withDelay(clone(materializeOrganization(Number(organizationId), Number(viewerId))));
  },

  async updateOrganization(organizationId, payload) {
    const normalizedOrganizationId = Number(organizationId);
    const organization = getOrganization(normalizedOrganizationId);

    if (!organization) {
      const error = new Error('Организация не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    if (!isOrganizationNameUnique(payload.name || '', normalizedOrganizationId)) {
      const error = new Error('Организация с таким названием существует');
      error.status = 409;
      error.code = 'ORGANIZATION_NAME_CONFLICT';
      return withDelayReject(error);
    }

    organizations[normalizedOrganizationId] = {
      ...organization,
      name: payload.name.trim(),
      description: payload.description || '',
      link: payload.link || '',
      logoUrl: payload.logoUrl || organization.logoUrl
    };

    return withDelay(clone(organizations[normalizedOrganizationId]));
  },

  async leaveOrganization(organizationId, userId) {
    const normalizedOrganizationId = Number(organizationId);
    const organization = getOrganization(normalizedOrganizationId);

    if (!organization) {
      const error = new Error('Организация не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    if (organization.ownerId === Number(userId)) {
      const error = new Error('Владелец не может выйти из организации');
      error.status = 400;
      return withDelayReject(error);
    }

    organizationMembers[normalizedOrganizationId] = (organizationMembers[normalizedOrganizationId] || []).filter((memberId) => memberId !== Number(userId));

    mockState.projects = mockState.projects.map((project) => {
      if (project.organizationId !== normalizedOrganizationId) {
        return project;
      }

      return {
        ...project,
        participants: project.participants.filter((participant) => participant.userId !== Number(userId))
      };
    });

    mockState.organizationJoinRequests = mockState.organizationJoinRequests.filter(
      (request) => !(request.organizationId === normalizedOrganizationId && request.userId === Number(userId) && request.status === 'PENDING')
    );

    return withDelay({ left: true });
  },

  async deleteOrganization(organizationId) {
    const normalizedOrganizationId = Number(organizationId);

    if (!organizations[normalizedOrganizationId]) {
      const error = new Error('Организация не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    delete organizations[normalizedOrganizationId];
    delete organizationMembers[normalizedOrganizationId];

    mockState.organizationJoinRequests = mockState.organizationJoinRequests.filter((request) => request.organizationId !== normalizedOrganizationId);
    mockState.organizationInvites = mockState.organizationInvites.filter((invite) => invite.organizationId !== normalizedOrganizationId);

    const organizationProjectIds = mockState.projects
      .filter((project) => project.organizationId === normalizedOrganizationId)
      .map((project) => project.id);

    mockState.projects = mockState.projects.filter((project) => project.organizationId !== normalizedOrganizationId);
    mockState.tasks = mockState.tasks.filter((task) => !organizationProjectIds.includes(task.projectId));
    mockState.invites = mockState.invites.filter((invite) => !organizationProjectIds.includes(invite.projectId));

    return withDelay({ deleted: true });
  },

  async searchProjectsForJoin(viewerId, params = {}) {
    const { query = '', page = 1, pageSize = 15 } = params;
    const normalizedQuery = query.trim().toLowerCase();
    const source = mockState.projects
      .filter((project) => project.privacy === PROJECT_PRIVACY.PUBLIC)
      .filter((project) => !getProjectParticipant(project, viewerId))
      .filter((project) => {
        if (!normalizedQuery) {
          return true;
        }

        return `${project.name} ${project.description}`.toLowerCase().includes(normalizedQuery);
      })
      .sort(sortByName)
      .map((project) => mapProjectListItem(project, viewerId));

    return withDelay(paginate(source, page, pageSize));
  },

  async searchOrganizations(viewerId, params = {}) {
    const { query = '', page = 1, pageSize = 15 } = params;
    const normalizedQuery = query.trim().toLowerCase();
    const source = Object.values(organizations)
      .filter((organization) => !isOrganizationMember(organization.id, viewerId))
      .filter((organization) => {
        if (!normalizedQuery) {
          return true;
        }

        return `${organization.name} ${organization.description}`.toLowerCase().includes(normalizedQuery);
      })
      .sort(sortByName)
      .map((organization) => {
        const organizationId = organization.id;
        const request = mockState.organizationJoinRequests.find(
          (item) => item.organizationId === organizationId && item.userId === viewerId && item.status === 'PENDING'
        );

        return {
          id: organization.id,
          logo: organization.logoUrl,
          name: organization.name,
          link: organization.link,
          description: organization.description,
          participantsCount: organizationMembers[organizationId]?.length || 0,
          projectsCount: mockState.projects.filter((project) => project.organizationId === organizationId).length,
          hasPendingRequest: Boolean(request)
        };
      });

    return withDelay(paginate(source, page, pageSize));
  },

  async joinPublicProject(projectId, viewerId) {
    const index = mockState.projects.findIndex((project) => project.id === Number(projectId));

    if (index < 0) {
      const error = new Error('Проект не найден');
      error.status = 404;
      return withDelayReject(error);
    }

    const project = mockState.projects[index];

    if (project.privacy !== PROJECT_PRIVACY.PUBLIC) {
      const error = new Error('Проект недоступен для вступления');
      error.status = 403;
      return withDelayReject(error);
    }

    if (project.organizationId && !isOrganizationMember(project.organizationId, viewerId)) {
      const error = new Error('Необходимо присоединиться к организации');
      error.status = 403;
      error.code = ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION;
      return withDelayReject(error);
    }

    const participant = getProjectParticipant(project, viewerId);

    if (participant) {
      return withDelay({ joined: true, role: participant.role });
    }

    mockState.projects[index].participants.push({
      userId: viewerId,
      role: PROJECT_MEMBER_ROLE.MEMBER
    });
    updateProjectLastActivity(project.id);

    return withDelay({ joined: true, role: PROJECT_MEMBER_ROLE.MEMBER });
  },

  async requestOrganizationAccess(organizationId, viewerId) {
    const normalizedOrganizationId = Number(organizationId);
    const organization = getOrganization(normalizedOrganizationId);

    if (!organization) {
      const error = new Error('Организация не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    if (isOrganizationMember(normalizedOrganizationId, viewerId)) {
      return withDelay({ requested: false, alreadyMember: true });
    }

    const existing = mockState.organizationJoinRequests.find(
      (item) => item.organizationId === normalizedOrganizationId && item.userId === viewerId && item.status === 'PENDING'
    );

    if (existing) {
      return withDelay({ requested: true, duplicate: true });
    }

    mockState.organizationJoinRequests.unshift({
      id: `org-request-${normalizedOrganizationId}-${viewerId}-${Date.now()}`,
      organizationId: normalizedOrganizationId,
      ownerId: organization.ownerId,
      userId: viewerId,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    return withDelay({ requested: true });
  },

  async approveOrganizationJoinRequest(organizationId, requestUserId) {
    const normalizedOrganizationId = Number(organizationId);
    const normalizedRequestUserId = Number(requestUserId);
    const requestIndex = mockState.organizationJoinRequests.findIndex(
      (item) => item.organizationId === normalizedOrganizationId && item.userId === normalizedRequestUserId && item.status === 'PENDING'
    );

    if (requestIndex < 0) {
      const error = new Error('Заявка не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    mockState.organizationJoinRequests[requestIndex] = {
      ...mockState.organizationJoinRequests[requestIndex],
      status: 'APPROVED'
    };

    if (!organizationMembers[normalizedOrganizationId]) {
      organizationMembers[normalizedOrganizationId] = [];
    }

    if (!organizationMembers[normalizedOrganizationId].includes(normalizedRequestUserId)) {
      organizationMembers[normalizedOrganizationId].push(normalizedRequestUserId);
    }

    return withDelay({ approved: true });
  },

  async rejectOrganizationJoinRequest(organizationId, requestUserId) {
    const normalizedOrganizationId = Number(organizationId);
    const normalizedRequestUserId = Number(requestUserId);
    const requestIndex = mockState.organizationJoinRequests.findIndex(
      (item) => item.organizationId === normalizedOrganizationId && item.userId === normalizedRequestUserId && item.status === 'PENDING'
    );

    if (requestIndex < 0) {
      const error = new Error('Заявка не найдена');
      error.status = 404;
      return withDelayReject(error);
    }

    mockState.organizationJoinRequests[requestIndex] = {
      ...mockState.organizationJoinRequests[requestIndex],
      status: 'REJECTED'
    };

    return withDelay({ rejected: true });
  },

  async createOrganization(payload) {
    const normalizedName = payload.name?.trim() || '';
    const exists = Object.values(organizations).some((organization) => organization.name.toLowerCase() === normalizedName.toLowerCase());

    if (exists) {
      const error = new Error('Организация с таким названием существует');
      error.status = 409;
      error.code = 'ORGANIZATION_NAME_CONFLICT';
      return withDelayReject(error);
    }

    return withDelay({
      accepted: false,
      reason: 'NOT_IMPLEMENTED'
    });
  },

  async getSeedData() {
    return withDelay({
      users: clone(USERS),
      projects: clone(mockState.projects),
      tasks: clone(mockState.tasks),
      organizations: clone(organizations),
      organizationMembers: clone(organizationMembers),
      organizationInvites: clone(mockState.organizationInvites),
      organizationJoinRequests: clone(mockState.organizationJoinRequests)
    });
  },

  async createMockProject(payload) {
    const organizationId = payload.organizationId || null;
    const ownerId = organizationId ? getOrganization(organizationId)?.ownerId : null;
    const participants = clone(payload.participants || []);
    const hasOrganizationOwner = ownerId && participants.some((participant) => participant.userId === ownerId);

    if (ownerId && !hasOrganizationOwner) {
      participants.push({
        userId: ownerId,
        role: PROJECT_MEMBER_ROLE.OWNER
      });
    }

    const project = {
      id: nextProjectId,
      organizationId,
      name: payload.name,
      description: payload.description || '',
      stack: payload.stack || [],
      privacy: payload.privacy,
      aiReviewEnabled: Boolean(payload.aiReviewEnabled),
      repositoryUrl: payload.repositoryUrl || '',
      participants,
      taskIds: [],
      lastActivityAt: new Date().toISOString()
    };

    nextProjectId += 1;
    mockState.projects.unshift(project);

    return withDelay(clone(project));
  }
};

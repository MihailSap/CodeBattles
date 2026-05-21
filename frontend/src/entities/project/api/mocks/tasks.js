import { TASK_REVIEW_TYPE, TASK_STATUS } from '../../model';

const makeDate = (daysFromNow, hour, minute) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const MOCK_TASKS = [
  {
    id: 9901,
    projectId: 9999,
    name: 'Настроить базовый роутинг',
    description:
      'Нужно настроить главную страницу, страницу ошибки 404 и ленивую загрузку компонентов. Приложение должно корректно обрабатывать недопустимые URL.',
    requirements:
      '1. Использовать createBrowserRouter из react-router-dom v6.\n2. Реализовать Suspense для lazy components.\n3. Покрытие тестами не менее 80%.',
    evaluationCriteria: '1. Отсутствие ошибок в консоли.\n2. Корректный роутинг.\n3. Bundle split работает.',
    status: TASK_STATUS.IN_PROGRESS,
    deadline: makeDate(5, 18, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [11, 13, 15, 57],
    reviewerIds: [12],
  },
  {
    id: 9902,
    projectId: 9999,
    name: 'Подключить UI-кит и стили',
    description:
      'Интегрировать базовые CSS-переменные, собрать компоненты кнопок и инпутов. Настроить темы (Dark/Light).',
    requirements: 'Только нативные CSS Variables и CSS Modules. Никаких сторонних библиотек.',
    evaluationCriteria: 'Все компоненты из макета реализованы. Темы переключаются без задержек.',
    status: TASK_STATUS.IN_REVIEW,
    deadline: makeDate(2, 12, 0),
    reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT,
    assigneeIds: [57, 25, 28, 16, 20, 22, 23],
    reviewerIds: [14, 15],
  },
  {
    id: 9903,
    projectId: 9999,
    name: 'Разработать Architecture Diagram Canvas',
    description:
      'Разработать сложный компонент для отображения графа архитектуры с возможностью зума, панорамирования и перемещения узлов графа.',
    requirements:
      '1. Никаких D3 или cytoscape, только React + SVG.\n2. Оптимизация производительности для 1000+ узлов.\n3. Использование Redux для хранения координат.',
    evaluationCriteria:
      '1. Плавно зумится (60 FPS).\n2. Узлы перетаскиваются без лагов.\n3. Корректное обновление стейта в Redux.',
    status: TASK_STATUS.REWORK,
    deadline: makeDate(4, 14, 30),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [57, 17, 13, 15],
    reviewerIds: [12, 14],
  },
  {
    id: 9904,
    projectId: 9999,
    name: 'Реализовать парсер конфигов архитектуры',
    description: 'Утилита для трансформации сырого JSON с бэка в графовую структуру (Nodes и Edges).',
    requirements: '1. Написать чистые функции.\n2. 100% покрытие тестами Vitest.',
    evaluationCriteria: 'Парсер отрабатывает за <50ms для файла 2MB.',
    status: TASK_STATUS.DONE,
    deadline: makeDate(-1, 16, 0),
    reviewType: TASK_REVIEW_TYPE.AI_ONLY,
    assigneeIds: [57, 11],
    reviewerIds: [],
  },
  {
    id: 9801,
    projectId: 9999,
    name: 'Сделать auth middleware',
    description:
      'Разработать Redux middleware для обработки JWT токенов, автоматического refresh-запроса и редиректа при 401 ошибке.',
    requirements:
      '1. Использовать Axios Interceptors.\n2. Обрабатывать гонку запросов (race conditions) при обновлении токена.\n3. Сохранять access токен в памяти, refresh - в httpOnly cookie.',
    evaluationCriteria: 'Код безопасен, refresh логика работает параллельно для нескольких запросов.',
    status: TASK_STATUS.IN_REVIEW,
    deadline: makeDate(3, 10, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [12],
    reviewerIds: [57],
  },
  {
    id: 9802,
    projectId: 9999,
    name: 'Настроить CI/CD',
    description:
      'Настроить GitHub Actions для сборки Vite приложения, запуска тестов, проверки линтера и деплоя на Vercel.',
    requirements: '1. Кэширование node_modules.\n2. Отдельные job для build и test.\n3. Секреты для Vercel token.',
    evaluationCriteria: 'Пайплайн проходит быстрее 2 минут.',
    status: TASK_STATUS.REWORK,
    deadline: makeDate(1, 15, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [14],
    reviewerIds: [57, 12],
  },
  {
    id: 9803,
    projectId: 9999,
    name: 'Интеграция Sentry',
    description: 'Интегрировать Sentry для трекинга ошибок фронтенда. Настроить маппинг sourcemaps.',
    requirements:
      '1. Инициализация только в production.\n2. Не отправлять логи локально.\n3. Интеграция с React Router для трекинга переходов.',
    evaluationCriteria: 'Ошибки ловятся, sourcemaps закрыты, релизы помечаются.',
    status: TASK_STATUS.DONE,
    deadline: makeDate(-2, 12, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [15, 16],
    reviewerIds: [57],
  },
  {
    id: 9804,
    projectId: 8888,
    name: 'Редизайн профиля',
    description: 'Обновить страницу профиля пользователя в соответствии с новыми макетами в Figma.',
    requirements: '1. Использовать CSS Modules.\n2. Адаптив под мобильные устройства.',
    evaluationCriteria: 'Полное соответствие макетам.',
    status: TASK_STATUS.IN_REVIEW,
    deadline: makeDate(1, 10, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [11],
    reviewerIds: [57],
  },
  {
    id: 9805,
    projectId: 7777,
    name: 'Оптимизация сборки',
    description: 'Оптимизировать размер бандла, настроить code splitting.',
    requirements: '1. Использовать React.lazy.\n2. Анализ бандла с помощью vite-bundle-visualizer.',
    evaluationCriteria: 'Размер initial chunk менее 300КБ.',
    status: TASK_STATUS.REWORK,
    deadline: makeDate(2, 10, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [12],
    reviewerIds: [57],
  },
  {
    id: 9806,
    projectId: 6666,
    name: 'Написать юнит тесты',
    description: 'Покрыть юнит тестами основные утилиты и компоненты.',
    requirements: '1. Использовать Vitest и React Testing Library.',
    evaluationCriteria: 'Покрытие больше 80%.',
    status: TASK_STATUS.DONE,
    deadline: makeDate(-4, 12, 0),
    reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
    assigneeIds: [14],
    reviewerIds: [57],
  },
];

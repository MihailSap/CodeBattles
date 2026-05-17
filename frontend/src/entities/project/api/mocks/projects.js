import { PROJECT_MEMBER_ROLE, PROJECT_PRIVACY } from '../../model';
import { MOCK_USERS } from './users';

export const MOCK_PROJECTS = [
  {
    id: 9999,
    organizationId: 300,
    organizationName: 'CodeBattles Team',
    name: 'Personal Architecture Notes',
    description: 'Учебный проект для обкатки архитектуры, стейт-менеджеров и тестирования.',
    stack: ['React', 'Redux Toolkit', 'Vite', 'Vitest'],
    privacy: PROJECT_PRIVACY.PUBLIC,
    aiReviewEnabled: true,
    repositoryUrl: 'https://github.com/imimorgo5/personal-architecture-notes',
    lastActivityAt: '2026-05-11T00:00:00Z',
    viewerRole: PROJECT_MEMBER_ROLE.OWNER,
    canSeeTasks: true,
    participants: MOCK_USERS,
    openTasksCount: 4,
    participantsCount: MOCK_USERS.length
  },
  {
    id: 8888,
    organizationId: 300,
    organizationName: 'CodeBattles Team',
    name: 'Backend Microservices',
    description: 'Микросервисы для CodeBattles.',
    stack: ['Spring Boot', 'Kafka', 'PostgreSQL'],
    privacy: PROJECT_PRIVACY.PRIVATE,
    aiReviewEnabled: true,
    repositoryUrl: 'https://github.com/imimorgo5/backend-microservices',
    lastActivityAt: '2026-05-10T00:00:00Z',
    viewerRole: PROJECT_MEMBER_ROLE.DEVELOPER,
    canSeeTasks: true,
    participants: MOCK_USERS,
    openTasksCount: 1,
    participantsCount: MOCK_USERS.length
  },
  {
    id: 7777,
    organizationId: 400,
    organizationName: 'DeepMind Corp',
    name: 'AI Research',
    description: 'Исследовательский проект.',
    stack: ['Python', 'PyTorch', 'Jupyter'],
    privacy: PROJECT_PRIVACY.PUBLIC,
    aiReviewEnabled: false,
    repositoryUrl: 'https://github.com/imimorgo5/ai-research',
    lastActivityAt: '2026-05-09T00:00:00Z',
    viewerRole: PROJECT_MEMBER_ROLE.GUEST,
    canSeeTasks: true,
    participants: MOCK_USERS,
    openTasksCount: 1,
    participantsCount: MOCK_USERS.length
  },
  {
    id: 6666,
    organizationId: null,
    organizationName: '',
    name: 'My Personal Website',
    description: 'Сайт-визитка.',
    stack: ['HTML', 'CSS', 'JS'],
    privacy: PROJECT_PRIVACY.PUBLIC,
    aiReviewEnabled: false,
    repositoryUrl: 'https://github.com/imimorgo5/my-website',
    lastActivityAt: '2026-05-08T00:00:00Z',
    viewerRole: PROJECT_MEMBER_ROLE.OWNER,
    canSeeTasks: true,
    participants: MOCK_USERS,
    openTasksCount: 1,
    participantsCount: MOCK_USERS.length
  }
];

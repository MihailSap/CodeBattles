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

const allSkills = SKILL_GROUPS.flatMap((group) => group.options);

const pickStack = (indexes) => indexes.map((index) => allSkills[index % allSkills.length]).sort((a, b) => a.localeCompare(b, 'ru', { sensitivity: 'base' }));

const USERS = [
  { id: 57, login: 'imimorgo5', email: 'ilyamuravyov@mail.ru', fullName: 'Муравьев Илья Германович' },
  { id: 11, login: 'kate_west', email: 'kate.west@mail.ru', fullName: 'Кузнецова Екатерина Андреевна', avatar: avatarPool[1] },
  { id: 12, login: 'alexr', email: 'alex.r@mail.ru', fullName: 'Романов Александр Сергеевич', avatar: avatarPool[2] },
  { id: 13, login: 'nikita_dev', email: 'nikita.dev@mail.ru', fullName: 'Волков Никита Романович', avatar: avatarPool[3] },
  { id: 14, login: 'lina_code', email: 'lina.code@mail.ru', fullName: 'Петрова Алина Олеговна', avatar: avatarPool[4] },
  { id: 15, login: 'max_core', email: 'max.core@mail.ru', fullName: 'Соколов Максим Дмитриевич', avatar: avatarPool[5] },
  { id: 16, login: 'olga_ui', email: 'olga.ui@mail.ru', fullName: 'Климова Ольга Николаевна', avatar: avatarPool[6] },
  { id: 17, login: 'denis_ml', email: 'denis.ml@mail.ru', fullName: 'Исаев Денис Артемович', avatar: avatarPool[7] },
  { id: 18, login: 'sasha_qa', email: 'sasha.qa@mail.ru', fullName: 'Федорова Александра Павловна', avatar: avatarPool[8] },
  { id: 19, login: 'tim_ops', email: 'tim.ops@mail.ru', fullName: 'Зорин Тимур Андреевич', avatar: avatarPool[9] },
  { id: 20, login: 'vera_arch', email: 'vera.arch@mail.ru', fullName: 'Борисова Вера Ильинична', avatar: '' },
  { id: 21, login: 'igor_api', email: 'igor.api@mail.ru', fullName: 'Павлов Игорь Евгеньевич', avatar: avatarPool[2] }
];

const organizations = {
  300: { id: 300, name: 'CodeBattles Team' },
  301: { id: 301, name: 'DevCore Group' }
};

const organizationMembers = {
  300: [57, 11, 12, 13, 14, 16, 20],
  301: [15, 17, 18, 19, 21]
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
    { id: 5015, projectId: 1005, name: 'Улучшить шаблон релизов', description: '', requirements: '', evaluationCriteria: '', status: TASK_STATUS.DONE, deadline: makeDate(15, 15, 20), reviewType: TASK_REVIEW_TYPE.AUTO_PROJECT, assigneeIds: [19] }
  ],
  invites: []
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

const makeInviteLink = (token) => {
  const base = typeof window === 'undefined' ? '' : window.location.origin;
  return `${base}/projects/join/${token}`;
};

const createInviteToken = () => `inv-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

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
      link: makeInviteLink(token),
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

  async getSeedData() {
    return withDelay({
      users: clone(USERS),
      projects: clone(mockState.projects),
      tasks: clone(mockState.tasks)
    });
  },

  async createMockProject(payload) {
    const project = {
      id: nextProjectId,
      organizationId: payload.organizationId || null,
      name: payload.name,
      description: payload.description || '',
      stack: payload.stack || [],
      privacy: payload.privacy,
      aiReviewEnabled: Boolean(payload.aiReviewEnabled),
      repositoryUrl: payload.repositoryUrl || '',
      participants: payload.participants || [],
      taskIds: [],
      lastActivityAt: new Date().toISOString()
    };

    nextProjectId += 1;
    mockState.projects.unshift(project);

    return withDelay(clone(project));
  }
};

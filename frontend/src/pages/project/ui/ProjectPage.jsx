import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import privateIcon from '@/shared/assets/private-icon.svg';
import participantsCountIcon from '@/shared/assets/participants-count-icon.svg';
import tasksCountIcon from '@/shared/assets/tasks-count-icon.svg';
import lastActivityIcon from '@/shared/assets/last-activity-icon.svg';
import {
  projectsApi,
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useLeaveProjectMutation,
  useUpdateProjectMutation,
} from '@/entities/project';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import EntityTabs from '@/shared/ui/entity-tabs';
import { AvatarIcon, CheckIcon, CrossIcon, SearchIcon } from '@/shared/ui/icons';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import {
  ACCESS_ERROR_CODE,
  PROJECT_MEMBER_ROLE,
  PROJECT_MEMBER_ROLE_LABELS,
  PROJECT_PRIVACY,
  PROJECT_PRIVACY_LABELS,
  projectSettingsFormSchema,
  TASK_STATUS,
  TASK_STATUS_LABELS,
} from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { useDebouncedValue } from '@/shared/lib/hooks';
import { useSnackbar } from '@/shared/lib/hooks';
import { lazyNamed } from '@/shared/lib';
import {
  formatDeadline,
  formatLastActivity,
  getDeadlineToneClass,
  sortParticipants,
  sortTasks,
  truncateText,
} from '@/entities/project';
import projectPageStyles from './ProjectPage.module.scss';
const InviteLinkModal = lazyNamed(() => import('@/features/generate-invite-link'), 'InviteLinkModal');
const ProjectSkillsSelector = lazyNamed(() => import('@/entities/stack'), 'ProjectSkillsSelector');

const tabs = {
  tasks: 'Задачи',
  participants: 'Участники',
  settings: 'Настройки',
};

const getProjectSettingsDefaults = (project) => ({
  name: project?.name || '',
  repositoryUrl: project?.repositoryUrl || '',
  description: project?.description || '',
  stack: project?.stack || [],
  privacy: project?.privacy || PROJECT_PRIVACY.PUBLIC,
  aiReviewEnabled: Boolean(project?.aiReviewEnabled),
});

const TASK_STATUS_CLASS = {
  [TASK_STATUS.IN_PROGRESS]: projectPageStyles.isInProgress,
  [TASK_STATUS.IN_REVIEW]: projectPageStyles.isInReview,
  [TASK_STATUS.REWORK]: projectPageStyles.isRework,
  [TASK_STATUS.DONE]: projectPageStyles.isDone,
};

const DEADLINE_TONE_CLASS = {
  success: projectPageStyles.isSuccess,
  warning: projectPageStyles.isWarning,
  error: projectPageStyles.isError,
};

const ProjectPage = () => {
  const { userId } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasksMode, setTasksMode] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviteSubmitting, setInviteSubmitting] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const {
    control: settingsControl,
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettings,
    formState: {
      errors: settingsErrors,
      isSubmitted: isSettingsSubmitted,
      isValid: isSettingsValid,
      touchedFields: settingsTouchedFields,
    },
  } = useForm({
    resolver: zodResolver(projectSettingsFormSchema),
    defaultValues: getProjectSettingsDefaults(),
    mode: 'onChange',
  });

  const settingsDraft = useWatch({
    control: settingsControl,
  });

  const debouncedTaskSearch = useDebouncedValue(taskSearch, 300);

  const {
    data: project,
    error: projectError,
    isLoading,
    refetch: refetchProject,
  } = useGetProjectByIdQuery(projectId, {
    refetchOnMountOrArgChange: 30,
  });

  const [updateProject, { isLoading: isSettingsSubmitting }] = useUpdateProjectMutation();
  const [leaveProject, { isLoading: isLeaveSubmitting }] = useLeaveProjectMutation();
  const [deleteProject, { isLoading: isDeleteSubmitting }] = useDeleteProjectMutation();
  const isOwner = project?.viewerRole === PROJECT_MEMBER_ROLE.OWNER;

  useEffect(() => {
    if (!project) {
      return;
    }

    resetSettings(getProjectSettingsDefaults(project));
  }, [project, resetSettings]);

  useEffect(() => {
    if (!projectError) {
      return;
    }

    if (projectError?.status === 403 && projectError?.code === ACCESS_ERROR_CODE.FORBIDDEN_PROJECT) {
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Необходимо присоединиться к проекту для просмотра',
        },
      });

      return;
    }

    if (projectError?.status === 403 && projectError?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Необходимо присоединиться к организации для просмотра проекта',
        },
      });

      return;
    }

    navigate(ROUTES.projects, {
      replace: true,
    });
  }, [navigate, projectError]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');

      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.search, location.state, navigate, showSnackbar]);

  const allTasks = useMemo(() => sortTasks(project?.tasks || []), [project?.tasks]);

  const visibleTasksSource = useMemo(() => {
    if (!project) {
      return [];
    }

    const normalizedSearch = debouncedTaskSearch.trim().toLowerCase();

    return allTasks
      .filter((task) => {
        if (tasksMode === 'mine') {
          return task.assignees.some((assignee) => assignee.id === Number(userId));
        }

        if (!isOwner) {
          return task.assignees.some((assignee) => assignee.id === Number(userId));
        }

        return true;
      })
      .filter((task) => {
        if (!normalizedSearch) {
          return true;
        }

        return task.name.toLowerCase().includes(normalizedSearch);
      });
  }, [allTasks, isOwner, project, debouncedTaskSearch, tasksMode, userId]);

  const participants = useMemo(() => sortParticipants(project?.participants || []), [project?.participants]);
  const openTasksCount = useMemo(() => allTasks.filter((task) => task.status !== TASK_STATUS.DONE).length, [allTasks]);

  const currentUserTaskCount = useMemo(
    () =>
      allTasks.filter(
        (task) => task.assignees.some((assignee) => assignee.id === Number(userId)) && task.status !== TASK_STATUS.DONE
      ).length,
    [allTasks, userId]
  );

  const availableTabs = useMemo(() => {
    const baseTabs = [
      {
        key: 'tasks',
        label: tabs.tasks,
      },
      {
        key: 'participants',
        label: tabs.participants,
      },
    ];

    if (isOwner) {
      baseTabs.push({
        key: 'settings',
        label: tabs.settings,
      });
    }

    return baseTabs;
  }, [isOwner]);

  const requestedTab = searchParams.get('tab');

  const activeTab = availableTabs.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : availableTabs[0]?.key || 'tasks';

  const handleTabChange = (tabKey) => {
    setSearchParams(
      (currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.set('tab', tabKey);

        return nextParams;
      },
      {
        replace: true,
      }
    );
  };

  const getSettingsError = (fieldName) => {
    if (!(settingsTouchedFields[fieldName] || isSettingsSubmitted)) {
      return '';
    }

    return settingsErrors[fieldName]?.message || '';
  };

  const settingsNameError = getSettingsError('name');
  const settingsRepositoryError = getSettingsError('repositoryUrl');

  const hasSettingsChanges = useMemo(() => {
    if (!project || !settingsDraft) {
      return false;
    }

    return (
      settingsDraft.name !== project.name ||
      settingsDraft.repositoryUrl !== project.repositoryUrl ||
      settingsDraft.description !== project.description ||
      settingsDraft.privacy !== project.privacy ||
      settingsDraft.aiReviewEnabled !== project.aiReviewEnabled ||
      JSON.stringify(settingsDraft.stack) !== JSON.stringify(project.stack)
    );
  }, [project, settingsDraft]);

  const handleInviteGenerate = async (payload) => {
    setInviteSubmitting(true);

    try {
      return await projectsApi.generateProjectInvite(project.id, payload);
    } catch {
      showSnackbar('Не удалось сформировать ссылку. Попробуйте позже', 'error');

      return null;
    } finally {
      setInviteSubmitting(false);
    }
  };

  const saveSettings = async (settingsDraft) => {
    if (!hasSettingsChanges) {
      return;
    }

    try {
      const payload = {};

      if (settingsDraft.name.trim() !== project.name) {
        payload.name = settingsDraft.name.trim();
      }

      if (settingsDraft.repositoryUrl.trim() !== project.repositoryUrl) {
        payload.repositoryUrl = settingsDraft.repositoryUrl.trim();
      }

      if (settingsDraft.description !== project.description) {
        payload.description = settingsDraft.description;
      }

      if (JSON.stringify(settingsDraft.stack) !== JSON.stringify(project.stack)) {
        payload.stack = settingsDraft.stack;
      }

      if (settingsDraft.privacy !== project.privacy) {
        payload.privacy = settingsDraft.privacy;
      }

      if (settingsDraft.aiReviewEnabled !== project.aiReviewEnabled) {
        payload.aiReviewEnabled = settingsDraft.aiReviewEnabled;
      }

      await updateProject({
        projectId: project.id,
        payload,
      }).unwrap();

      const fullProject = await refetchProject().unwrap();

      resetSettings({
        name: fullProject.name,
        repositoryUrl: fullProject.repositoryUrl,
        description: fullProject.description || '',
        stack: fullProject.stack,
        privacy: fullProject.privacy,
        aiReviewEnabled: Boolean(fullProject.aiReviewEnabled),
      });

      showSnackbar('Изменения сохранены', 'success');
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        showSnackbar('Проект с таким названием уже существует', 'error');
      } else {
        showSnackbar('Возникла непредвиденная ошибка. Попробуйте позже', 'error');
      }
    }
  };

  const handleSaveSettings = handleSettingsSubmit(saveSettings);

  const handleCancelSettings = () => {
    resetSettings(getProjectSettingsDefaults(project));
  };

  const handleLeaveProject = async () => {
    try {
      await leaveProject(project.id).unwrap();

      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Вы вышли из проекта',
          snackbarType: 'success',
        },
      });
    } catch {
      showSnackbar('Не удалось выйти из проекта', 'error');
    }

    setLeaveModalOpen(false);
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(project.id).unwrap();

      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Проект удален',
          snackbarType: 'success',
        },
      });
    } catch {
      showSnackbar('Не удалось удалить проект', 'error');
    }

    setDeleteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className={projectPageStyles.root}>
        <div className={projectPageStyles.loader}>
          <Spinner />
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const description = project.description || '';
  const isLongDescription = description.length > 1000;
  const shownDescription = isLongDescription && !showFullDescription ? `${description.slice(0, 1000)}...` : description;

  return (
    <div className={projectPageStyles.root}>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className={projectPageStyles.content}>
        <section className={[projectPageStyles.info, projectPageStyles.sectionCard].join(' ')}>
          <div className={projectPageStyles.titleRow}>
            <div className={projectPageStyles.titleWrap}>
              <h1 className={projectPageStyles.title}>{project.name}</h1>
              {project.privacy === PROJECT_PRIVACY.PRIVATE && (
                <img src={privateIcon} alt="Приватный проект" className={projectPageStyles.privateIcon} />
              )}
            </div>
            <span className={projectPageStyles.roleTag}>{PROJECT_MEMBER_ROLE_LABELS[project.viewerRole]}</span>
          </div>

          {project.organizationName && <p className={projectPageStyles.organization}>{project.organizationName}</p>}

          {description && (
            <p className={projectPageStyles.description}>
              <span className={projectPageStyles.descriptionLabel}>Описание проекта: </span>
              <span>{shownDescription}</span>
              {isLongDescription && (
                <button
                  className={projectPageStyles.descriptionToggle}
                  type="button"
                  onClick={() => setShowFullDescription((prev) => !prev)}
                >
                  {showFullDescription ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {project.repositoryUrl && (
            <a className={projectPageStyles.repository} href={project.repositoryUrl} target="_blank" rel="noreferrer">
              {truncateText(project.repositoryUrl, 100)}
            </a>
          )}

          {project.stack.length > 0 && (
            <div className={projectPageStyles.stackList}>
              {project.stack.map((skill) => (
                <span key={skill} className={projectPageStyles.stackTag}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className={projectPageStyles.metrics}>
            <div className={projectPageStyles.metricItem}>
              <img src={participantsCountIcon} alt="Участники" />
              <span>Участников: {project.participants.length}</span>
            </div>
            <div className={projectPageStyles.metricItem}>
              <img src={tasksCountIcon} alt="Открытые задачи" />
              <span>Открытых задач: {openTasksCount}</span>
            </div>
            <div className={projectPageStyles.metricItem}>
              <img src={lastActivityIcon} alt="Последняя активность" />
              <span>Последняя активность: {formatLastActivity(project.lastActivityAt)}</span>
            </div>
          </div>
        </section>

        <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={handleTabChange} />

        {activeTab === 'tasks' && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                {isOwner ? (
                  <div className={projectPageStyles.modeSwitch}>
                    <span
                      className={[projectPageStyles.modeThumb, tasksMode === 'mine' ? projectPageStyles.isMine : '']
                        .filter(Boolean)
                        .join(' ')}
                    />
                    <button
                      type="button"
                      className={[projectPageStyles.modeButton, tasksMode === 'all' ? projectPageStyles.isActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setTasksMode('all')}
                    >
                      Все задачи ({openTasksCount})
                    </button>
                    <button
                      type="button"
                      className={[projectPageStyles.modeButton, tasksMode === 'mine' ? projectPageStyles.isActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setTasksMode('mine')}
                    >
                      Мои задачи ({currentUserTaskCount})
                    </button>
                  </div>
                ) : (
                  <span className={projectPageStyles.myTasks}>Задачи ({currentUserTaskCount})</span>
                )}
              </div>

              <div className={projectPageStyles.controlsRight}>
                {project.canSeeTasks && (
                  <label className={projectPageStyles.searchField}>
                    <SearchIcon />
                    <input
                      type="search"
                      placeholder="Поиск"
                      value={taskSearch}
                      onChange={(event) => setTaskSearch(event.target.value.slice(0, 100))}
                    />
                  </label>
                )}

                {isOwner && (
                  <button
                    className={[projectPageStyles.actionButton, projectPageStyles.isSuccess].join(' ')}
                    type="button"
                    onClick={() => navigate(`${ROUTES.projects}/${project.id}/tasks/create`)}
                  >
                    Создать задачу
                  </button>
                )}
              </div>
            </div>

            {!project.canSeeTasks ? (
              <section className={[projectPageStyles.sectionCard, projectPageStyles.emptyState].join(' ')}>
                Для просмотра задач необходимо присоединиться к проекту
              </section>
            ) : (
              <section className={[projectPageStyles.sectionCard, projectPageStyles.tableSection].join(' ')}>
                <div className={[projectPageStyles.tableRow, projectPageStyles.isHead].join(' ')}>
                  <span>Название</span>
                  <span>Статус</span>
                  <span>Исполнители</span>
                  <span>Дедлайн</span>
                </div>

                {visibleTasksSource.map((task) => (
                  <div
                    key={task.id}
                    className={projectPageStyles.tableRow}
                    onClick={() =>
                      navigate(ROUTES.projectTaskById.replace(':projectId', project.id).replace(':taskId', task.id))
                    }
                    role="presentation"
                  >
                    <span className={projectPageStyles.taskName} title={task.name}>
                      {truncateText(task.name, 50)}
                    </span>
                    <span
                      className={[projectPageStyles.taskStatus, TASK_STATUS_CLASS[task.status]]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className={projectPageStyles.assignees}>
                      {task.assignees.slice(0, 6).map((assignee) => (
                        <span key={assignee.id} className={projectPageStyles.assigneeAvatar} title={assignee.fullName}>
                          {assignee.avatar ? <img src={assignee.avatar} alt={assignee.fullName} /> : <AvatarIcon />}
                        </span>
                      ))}
                      {task.assignees.length > 6 && (
                        <span className={projectPageStyles.assigneeMore}>+{task.assignees.length - 6}</span>
                      )}
                    </span>
                    <span
                      className={[
                        projectPageStyles.deadline,
                        DEADLINE_TONE_CLASS[getDeadlineToneClass(task.deadline, task.status)],
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {formatDeadline(task.deadline)}
                    </span>
                  </div>
                ))}

                {visibleTasksSource.length === 0 && <p className={projectPageStyles.listEmpty}>Задачи не найдены</p>}
              </section>
            )}
          </>
        )}

        {activeTab === 'participants' && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                <span className={projectPageStyles.participantsCount}>Участники ({project.participants.length})</span>
              </div>

              <div className={projectPageStyles.controlsRight}>
                {isOwner ? (
                  <button
                    className={[projectPageStyles.actionButton, projectPageStyles.isPrimary].join(' ')}
                    type="button"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    Пригласить
                  </button>
                ) : (
                  project.canSeeTasks && (
                    <button
                      className={[projectPageStyles.actionButton, projectPageStyles.isDanger].join(' ')}
                      type="button"
                      onClick={() => setLeaveModalOpen(true)}
                    >
                      Выйти из проекта
                    </button>
                  )
                )}
              </div>
            </div>

            <section className={[projectPageStyles.sectionCard, projectPageStyles.participantsList].join(' ')}>
              {participants.map((participant) => (
                <Link
                  key={participant.id}
                  className={projectPageStyles.participantRow}
                  to={`${ROUTES.profile}/${participant.id}`}
                >
                  <div className={projectPageStyles.participantMain}>
                    <span className={projectPageStyles.participantAvatar}>
                      {participant.avatar ? (
                        <img src={participant.avatar} alt={participant.fullName} />
                      ) : (
                        <AvatarIcon />
                      )}
                    </span>
                    <span className={projectPageStyles.participantMeta}>
                      <span className={projectPageStyles.participantName}>{participant.fullName}</span>
                      <span className={projectPageStyles.participantLogin}>@{participant.login}</span>
                    </span>
                  </div>
                  <span className={projectPageStyles.participantRole}>
                    {PROJECT_MEMBER_ROLE_LABELS[participant.role]}
                  </span>
                </Link>
              ))}
            </section>
          </>
        )}

        {activeTab === 'settings' && isOwner && settingsDraft && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                <span className={projectPageStyles.participantsCount}>Настройки</span>
              </div>

              <div className={projectPageStyles.controlsRight}>
                <button
                  className={[projectPageStyles.actionButton, projectPageStyles.isDanger].join(' ')}
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Удалить проект
                </button>
              </div>
            </div>

            <form
              className={[projectPageStyles.sectionCard, projectPageStyles.settings].join(' ')}
              onSubmit={handleSaveSettings}
            >
              <div className={projectPageStyles.settingsField}>
                <label>Название</label>
                <input
                  className={[
                    projectPageStyles.settingsInput,
                    settingsNameError ? projectPageStyles.settingsInputError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  maxLength={100}
                  {...registerSettings('name')}
                />
                {settingsNameError && <p className={projectPageStyles.settingsError}>{settingsNameError}</p>}
              </div>

              <div className={projectPageStyles.settingsField}>
                <label>Ссылка на репозиторий</label>
                <input
                  className={[
                    projectPageStyles.settingsInput,
                    settingsRepositoryError ? projectPageStyles.settingsInputError : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  maxLength={500}
                  {...registerSettings('repositoryUrl')}
                />
                {settingsRepositoryError && (
                  <p className={projectPageStyles.settingsError}>{settingsRepositoryError}</p>
                )}
              </div>

              <div className={projectPageStyles.settingsField}>
                <label>Описание</label>
                <textarea
                  className={[projectPageStyles.settingsInput, projectPageStyles.settingsTextarea].join(' ')}
                  maxLength={3000}
                  {...registerSettings('description')}
                />
              </div>

              <div className={projectPageStyles.settingsField}>
                <Suspense fallback={null}>
                  <Controller
                    control={settingsControl}
                    name="stack"
                    render={({ field }) => (
                      <ProjectSkillsSelector
                        title="Технологический стек:"
                        titleClassName={projectPageStyles.settingsTitle}
                        value={field.value}
                        onChange={field.onChange}
                        forceOpenUp
                      />
                    )}
                  />
                </Suspense>
              </div>

              <div className={projectPageStyles.settingsField}>
                <h3 className={projectPageStyles.settingsTitle}>Приватность</h3>
                <div className={projectPageStyles.privacyRow}>
                  {[PROJECT_PRIVACY.PUBLIC, PROJECT_PRIVACY.PRIVATE].map((privacyValue) => (
                    <label key={privacyValue} className={projectPageStyles.privacyItem}>
                      <input type="radio" value={privacyValue} {...registerSettings('privacy')} />
                      <span>{PROJECT_PRIVACY_LABELS[privacyValue]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={projectPageStyles.settingsField}>
                <label className={projectPageStyles.aiCheck}>
                  <input type="checkbox" {...registerSettings('aiReviewEnabled')} />
                  <span>Включить AI-ревью</span>
                </label>
              </div>

              {hasSettingsChanges && (
                <div className={projectPageStyles.settingsActions}>
                  <button
                    className={[projectPageStyles.settingsAction, projectPageStyles.isSave].join(' ')}
                    type="submit"
                    disabled={!isSettingsValid || isSettingsSubmitting}
                    aria-label="Сохранить изменения"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    className={[projectPageStyles.settingsAction, projectPageStyles.isCancel].join(' ')}
                    type="button"
                    onClick={handleCancelSettings}
                    disabled={isSettingsSubmitting}
                    aria-label="Отменить изменения"
                  >
                    <CrossIcon />
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </main>

      {isInviteModalOpen && (
        <Suspense fallback={null}>
          <InviteLinkModal
            isOpen={isInviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            onGenerate={handleInviteGenerate}
            onCopySuccess={() => showSnackbar('Ссылка скопирована в буфер обмена', 'success')}
            isSubmitting={isInviteSubmitting}
          />
        </Suspense>
      )}

      <ConfirmActionModal
        isOpen={isLeaveModalOpen}
        title="Выход из проекта"
        description="Вы выйдите из проекта"
        confirmLabel="Выйти"
        onCancel={() => setLeaveModalOpen(false)}
        onConfirm={handleLeaveProject}
        isSubmitting={isLeaveSubmitting}
        isDeleteAction
      />

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Удаление проекта"
        description="Проект и связанные задачи будут удалены без возможности восстановления"
        confirmLabel="Удалить"
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        isSubmitting={isDeleteSubmitting}
        isDeleteAction
      />
    </div>
  );
};

export default ProjectPage;

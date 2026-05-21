import { Suspense, useEffect, useMemo, useState } from 'react';
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
  useUpdateProjectMutation
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
  TASK_STATUS,
  TASK_STATUS_LABELS
} from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { useDebouncedValue } from '@/shared/lib/hooks';
import { useSnackbar } from '@/shared/lib/hooks';
import { lazyNamed } from '@/shared/lib';
import { formatDeadline, formatLastActivity, getDeadlineToneClass, sortParticipants, sortTasks, truncateText } from '@/entities/project';
import { validateProjectName, validateRepositoryUrl } from '@/entities/project';
import './ProjectPage.css';

const InviteLinkModal = lazyNamed(() => import('@/features/generate-invite-link'), 'InviteLinkModal');
const ProjectSkillsSelector = lazyNamed(() => import('@/entities/stack'), 'ProjectSkillsSelector');

const tabs = {
  tasks: 'Задачи',
  participants: 'Участники',
  settings: 'Настройки'
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
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsTouched, setSettingsTouched] = useState({ name: false, repositoryUrl: false });
  const debouncedTaskSearch = useDebouncedValue(taskSearch, 300);
  const {
    data: project,
    error: projectError,
    isLoading,
    refetch: refetchProject
  } = useGetProjectByIdQuery(projectId, { refetchOnMountOrArgChange: 30 });
  const [updateProject, { isLoading: isSettingsSubmitting }] = useUpdateProjectMutation();
  const [leaveProject, { isLoading: isLeaveSubmitting }] = useLeaveProjectMutation();
  const [deleteProject, { isLoading: isDeleteSubmitting }] = useDeleteProjectMutation();

  const isOwner = project?.viewerRole === PROJECT_MEMBER_ROLE.OWNER;

  useEffect(() => {
    if (!project) {
      return;
    }

    setSettingsDraft({
      name: project.name,
      repositoryUrl: project.repositoryUrl,
      description: project.description,
      stack: project.stack,
      privacy: project.privacy,
      aiReviewEnabled: project.aiReviewEnabled
    });
  }, [project]);

  useEffect(() => {
    if (!projectError) {
      return;
    }

    if (projectError?.status === 403 && projectError?.code === ACCESS_ERROR_CODE.FORBIDDEN_PROJECT) {
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Необходимо присоединиться к проекту для просмотра'
        }
      });
      return;
    }

    if (projectError?.status === 403 && projectError?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Необходимо присоединиться к организации для просмотра проекта'
        }
      });
      return;
    }

    navigate(ROUTES.projects, { replace: true });
  }, [navigate, projectError]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
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
    () => allTasks.filter((task) => task.assignees.some((assignee) => assignee.id === Number(userId)) && task.status !== TASK_STATUS.DONE).length,
    [allTasks, userId]
  );

  const availableTabs = useMemo(() => {
    const baseTabs = [
      { key: 'tasks', label: tabs.tasks },
      { key: 'participants', label: tabs.participants }
    ];

    if (isOwner) {
      baseTabs.push({ key: 'settings', label: tabs.settings });
    }

    return baseTabs;
  }, [isOwner]);

  const requestedTab = searchParams.get('tab');
  const activeTab = availableTabs.some((tab) => tab.key === requestedTab) ? requestedTab : availableTabs[0]?.key || 'tasks';

  const handleTabChange = (tabKey) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('tab', tabKey);
      return nextParams;
    }, { replace: true });
  };

  const settingsNameError = useMemo(() => validateProjectName(settingsDraft?.name || ''), [settingsDraft?.name]);
  const settingsRepositoryError = useMemo(() => validateRepositoryUrl(settingsDraft?.repositoryUrl || ''), [settingsDraft?.repositoryUrl]);
  const settingsFormInvalid = Boolean(settingsNameError || settingsRepositoryError);

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

  const handleSaveSettings = async () => {
    setSettingsTouched({ name: true, repositoryUrl: true });

    if (settingsFormInvalid || !hasSettingsChanges) {
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

      await updateProject({ projectId: project.id, payload }).unwrap();
      const fullProject = await refetchProject().unwrap();
      setSettingsDraft({
        name: fullProject.name,
        repositoryUrl: fullProject.repositoryUrl,
        description: fullProject.description,
        stack: fullProject.stack,
        privacy: fullProject.privacy,
        aiReviewEnabled: fullProject.aiReviewEnabled
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

  const handleLeaveProject = async () => {
    try {
      await leaveProject(project.id).unwrap();
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Вы вышли из проекта',
          snackbarType: 'success'
        }
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
          snackbarType: 'success'
        }
      });
    } catch {
      showSnackbar('Не удалось удалить проект', 'error');
    }
    setDeleteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="project-page">
        <div className="project-page__loader">
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
    <div className="project-page">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className="project-page__content">
        <section className="project-page__info section-card">
          <div className="project-page__title-row">
            <div className="project-page__title-wrap">
              <h1 className="project-page__title">{project.name}</h1>
              {project.privacy === PROJECT_PRIVACY.PRIVATE && <img src={privateIcon} alt="Приватный проект" className="project-page__private-icon" />}
            </div>
            <span className="project-page__role-tag">{PROJECT_MEMBER_ROLE_LABELS[project.viewerRole]}</span>
          </div>

          {project.organizationName && <p className="project-page__organization">{project.organizationName}</p>}

          {description && (
            <p className="project-page__description">
              <span className="project-page__description-label">Описание проекта: </span>
              <span>{shownDescription}</span>
              {isLongDescription && (
                <button className="project-page__description-toggle" type="button" onClick={() => setShowFullDescription((prev) => !prev)}>
                  {showFullDescription ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {project.repositoryUrl && (
            <a className="project-page__repository" href={project.repositoryUrl} target="_blank" rel="noreferrer">
              {truncateText(project.repositoryUrl, 100)}
            </a>
          )}

          {project.stack.length > 0 && (
            <div className="project-page__stack-list">
              {project.stack.map((skill) => (
                <span key={skill} className="project-page__stack-tag">{skill}</span>
              ))}
            </div>
          )}

          <div className="project-page__metrics">
            <div className="project-page__metric-item">
              <img src={participantsCountIcon} alt="Участники" />
              <span>Участников: {project.participants.length}</span>
            </div>
            <div className="project-page__metric-item">
              <img src={tasksCountIcon} alt="Открытые задачи" />
              <span>Открытых задач: {openTasksCount}</span>
            </div>
            <div className="project-page__metric-item">
              <img src={lastActivityIcon} alt="Последняя активность" />
              <span>Последняя активность: {formatLastActivity(project.lastActivityAt)}</span>
            </div>
          </div>
        </section>

        <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={handleTabChange} />

        {activeTab === 'tasks' && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                {isOwner ? (
                  <div className="project-page__mode-switch">
                    <span className={`project-page__mode-thumb ${tasksMode === 'mine' ? 'project-page__mode-thumb--mine' : ''}`} />
                    <button type="button" className={`project-page__mode-button ${tasksMode === 'all' ? 'project-page__mode-button--active' : ''}`} onClick={() => setTasksMode('all')}>
                      Все задачи ({openTasksCount})
                    </button>
                    <button type="button" className={`project-page__mode-button ${tasksMode === 'mine' ? 'project-page__mode-button--active' : ''}`} onClick={() => setTasksMode('mine')}>
                      Мои задачи ({currentUserTaskCount})
                    </button>
                  </div>
                ) : (
                  <span className="project-page__my-tasks">Задачи ({currentUserTaskCount})</span>
                )}
              </div>

              <div className="project-page__controls-right">
                {project.canSeeTasks && (
                  <label className="project-page__search-field">
                    <SearchIcon />
                    <input type="search" placeholder="Поиск" value={taskSearch} onChange={(event) => setTaskSearch(event.target.value.slice(0, 100))} />
                  </label>
                )}

                {isOwner && (
                  <button
                    className="project-page__action-button project-page__action-button--success"
                    type="button"
                    onClick={() => navigate(`${ROUTES.projects}/${project.id}/tasks/create`)}
                  >
                    Создать задачу
                  </button>
                )}
              </div>
            </div>

            {!project.canSeeTasks ? (
              <section className="section-card project-page__empty-state">
                Для просмотра задач необходимо присоединиться к проекту
              </section>
            ) : (
              <section className="section-card project-page__table-section">
                <div className="project-page__table-row project-page__table-row--head">
                  <span>Название</span>
                  <span>Статус</span>
                  <span>Исполнители</span>
                  <span>Дедлайн</span>
                </div>

                {visibleTasksSource.map((task) => (
                  <div
                    key={task.id}
                    className="project-page__table-row"
                    onClick={() => navigate(ROUTES.projectTaskById.replace(':projectId', project.id).replace(':taskId', task.id))}
                    role="presentation"
                  >
                    <span className="project-page__task-name" title={task.name}>{truncateText(task.name, 50)}</span>
                    <span className={`project-page__task-status project-page__task-status--${task.status.toLowerCase()}`}>{TASK_STATUS_LABELS[task.status]}</span>
                    <span className="project-page__assignees">
                      {task.assignees.slice(0, 6).map((assignee) => (
                        <span key={assignee.id} className="project-page__assignee-avatar" title={assignee.fullName}>
                          {assignee.avatar ? <img src={assignee.avatar} alt={assignee.fullName} /> : <AvatarIcon />}
                        </span>
                      ))}
                      {task.assignees.length > 6 && <span className="project-page__assignee-more">+{task.assignees.length - 6}</span>}
                    </span>
                    <span className={`project-page__deadline ${getDeadlineToneClass(task.deadline, task.status)}`}>{formatDeadline(task.deadline)}</span>
                  </div>
                ))}

                {visibleTasksSource.length === 0 && <p className="project-page__list-empty">Задачи не найдены</p>}
              </section>
            )}
          </>
        )}

        {activeTab === 'participants' && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                <span className="project-page__participants-count">Участники ({project.participants.length})</span>
              </div>

              <div className="project-page__controls-right">
                {isOwner ? (
                  <button className="project-page__action-button project-page__action-button--primary" type="button" onClick={() => setInviteModalOpen(true)}>
                    Пригласить
                  </button>
                ) : project.canSeeTasks && (
                  <button className="project-page__action-button project-page__action-button--danger" type="button" onClick={() => setLeaveModalOpen(true)}>
                    Выйти из проекта
                  </button>
                )}
              </div>
            </div>

            <section className="section-card project-page__participants-list">
              {participants.map((participant) => (
                <Link key={participant.id} className="project-page__participant-row" to={`${ROUTES.profile}/${participant.id}`}>
                  <div className="project-page__participant-main">
                    <span className="project-page__participant-avatar">
                      {participant.avatar ? <img src={participant.avatar} alt={participant.fullName} /> : <AvatarIcon />}
                    </span>
                    <span className="project-page__participant-meta">
                      <span className="project-page__participant-name">{participant.fullName}</span>
                      <span className="project-page__participant-login">@{participant.login}</span>
                    </span>
                  </div>
                  <span className="project-page__participant-role">{PROJECT_MEMBER_ROLE_LABELS[participant.role]}</span>
                </Link>
              ))}
            </section>
          </>
        )}

        {activeTab === 'settings' && isOwner && settingsDraft && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                <span className="project-page__participants-count">Настройки</span>
              </div>

              <div className="project-page__controls-right">
                <button className="project-page__action-button project-page__action-button--danger" type="button" onClick={() => setDeleteModalOpen(true)}>
                  Удалить проект
                </button>
              </div>
            </div>

            <section className="section-card project-page__settings">
              <div className="project-page__settings-field">
                <label>Название</label>
                <input
                  className={`project-page__settings-input ${settingsTouched.name && settingsNameError ? 'project-page__settings-input--error' : ''}`}
                  value={settingsDraft.name}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                  onBlur={() => setSettingsTouched((prev) => ({ ...prev, name: true }))}
                />
                {settingsTouched.name && settingsNameError && <p className="project-page__settings-error">{settingsNameError}</p>}
              </div>

              <div className="project-page__settings-field">
                <label>Ссылка на репозиторий</label>
                <input
                  className={`project-page__settings-input ${settingsTouched.repositoryUrl && settingsRepositoryError ? 'project-page__settings-input--error' : ''}`}
                  value={settingsDraft.repositoryUrl}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, repositoryUrl: event.target.value.slice(0, 500) }))}
                  onBlur={() => setSettingsTouched((prev) => ({ ...prev, repositoryUrl: true }))}
                />
                {settingsTouched.repositoryUrl && settingsRepositoryError && <p className="project-page__settings-error">{settingsRepositoryError}</p>}
              </div>

              <div className="project-page__settings-field">
                <label>Описание</label>
                <textarea
                  className="project-page__settings-input project-page__settings-textarea"
                  value={settingsDraft.description}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, description: event.target.value.slice(0, 3000) }))}
                />
              </div>

              <div className="project-page__settings-field">
                <Suspense fallback={null}>
                  <ProjectSkillsSelector
                    title="Технологический стек:"
                    titleClassName="project-page__settings-title"
                    value={settingsDraft.stack}
                    onChange={(stack) => setSettingsDraft((prev) => ({ ...prev, stack }))}
                    forceOpenUp
                  />
                </Suspense>
              </div>

              <div className="project-page__settings-field">
                <h3 className="project-page__settings-title">Приватность</h3>
                <div className="project-page__privacy-row">
                  {[PROJECT_PRIVACY.PUBLIC, PROJECT_PRIVACY.PRIVATE].map((privacyValue) => (
                    <label key={privacyValue} className="project-page__privacy-item">
                      <input
                        type="radio"
                        checked={settingsDraft.privacy === privacyValue}
                        onChange={() => setSettingsDraft((prev) => ({ ...prev, privacy: privacyValue }))}
                      />
                      <span>{PROJECT_PRIVACY_LABELS[privacyValue]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="project-page__settings-field">
                <label className="project-page__ai-check">
                  <input
                    type="checkbox"
                    checked={settingsDraft.aiReviewEnabled}
                    onChange={(event) => setSettingsDraft((prev) => ({ ...prev, aiReviewEnabled: event.target.checked }))}
                  />
                  <span>Включить AI-ревью</span>
                </label>
              </div>

              {hasSettingsChanges && (
                <div className="project-page__settings-actions">
                  <button
                    className="project-page__settings-action project-page__settings-action--save"
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={settingsFormInvalid || isSettingsSubmitting}
                    aria-label="Сохранить изменения"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    className="project-page__settings-action project-page__settings-action--cancel"
                    type="button"
                    onClick={() => {
                      setSettingsDraft({
                        name: project.name,
                        repositoryUrl: project.repositoryUrl,
                        description: project.description,
                        stack: project.stack,
                        privacy: project.privacy,
                        aiReviewEnabled: project.aiReviewEnabled
                      });
                      setSettingsTouched({ name: false, repositoryUrl: false });
                    }}
                    disabled={isSettingsSubmitting}
                    aria-label="Отменить изменения"
                  >
                    <CrossIcon />
                  </button>
                </div>
              )}
            </section>
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

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import privateIcon from '../../assets/private-icon.svg';
import participantsCountIcon from '../../assets/participants-count-icon.svg';
import tasksCountIcon from '../../assets/tasks-count-icon.svg';
import lastActivityIcon from '../../assets/last-activity-icon.svg';
import { projectsApi } from '../../api/projectsApi';
import ConfirmActionModal from '../../components/ConfirmActionModal/ConfirmActionModal';
import { AvatarIcon, CheckIcon, CrossIcon, SearchIcon } from '../../components/Icons/Icons';
import Header from '../../components/Header/Header';
import InviteLinkModal from '../../components/InviteLinkModal/InviteLinkModal';
import ProjectSkillsSelector from '../../components/ProjectSkillsSelector/ProjectSkillsSelector';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import {
  ACCESS_ERROR_CODE,
  PROJECT_MEMBER_ROLE,
  PROJECT_MEMBER_ROLE_LABELS,
  PROJECT_PRIVACY,
  PROJECT_PRIVACY_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS
} from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useVisibleItems } from '../../hooks/useVisibleItems';
import { formatDeadline, formatLastActivity, getDeadlineToneClass, sortParticipants, sortTasks, truncateText } from '../../utils/projectFormatters';
import { validateProjectName, validateRepositoryUrl } from '../../utils/projectValidation';
import './ProjectPage.css';

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
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasksMode, setTasksMode] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [isInviteSubmitting, setInviteSubmitting] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setDeleteSubmitting] = useState(false);
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  const [isLeaveSubmitting, setLeaveSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsTouched, setSettingsTouched] = useState({ name: false, repositoryUrl: false });
  const [isSettingsSubmitting, setSettingsSubmitting] = useState(false);

  const isOwner = project?.viewerRole === PROJECT_MEMBER_ROLE.OWNER;

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      setIsLoading(true);

      try {
        const result = await projectsApi.getProjectById(projectId, Number(userId));

        if (!isMounted) {
          return;
        }

        setProject(result);
        setSettingsDraft({
          name: result.name,
          repositoryUrl: result.repositoryUrl,
          description: result.description,
          stack: result.stack,
          privacy: result.privacy,
          aiReviewEnabled: result.aiReviewEnabled
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.status === 403 && error?.code === ACCESS_ERROR_CODE.FORBIDDEN_PROJECT) {
          navigate(ROUTES.projects, {
            replace: true,
            state: {
              snackbarMessage: 'Необходимо присоединиться к проекту для просмотра'
            }
          });
          return;
        }

        if (error?.status === 403 && error?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
          navigate(ROUTES.projects, {
            replace: true,
            state: {
              snackbarMessage: 'Необходимо присоединиться к организации для просмотра проекта'
            }
          });
          return;
        }

        navigate(ROUTES.projects, { replace: true });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [navigate, projectId, userId]);

  useEffect(() => {
    if (!snackbar.message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSnackbar({ message: '', type: 'success' });
    }, 3200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [snackbar.message]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      setSnackbar({ message: location.state.snackbarMessage, type: location.state.snackbarType || 'success' });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const allTasks = useMemo(() => sortTasks(project?.tasks || []), [project?.tasks]);

  const visibleTasksSource = useMemo(() => {
    if (!project) {
      return [];
    }

    const normalizedSearch = taskSearch.trim().toLowerCase();

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
  }, [allTasks, isOwner, project, taskSearch, tasksMode, userId]);

  const { visibleItems: visibleTasks, hasMore: hasMoreTasks, sentinelRef: tasksSentinelRef } = useVisibleItems(visibleTasksSource, 20);

  const participants = useMemo(() => sortParticipants(project?.participants || []), [project?.participants]);
  const {
    visibleItems: visibleParticipants,
    hasMore: hasMoreParticipants,
    sentinelRef: participantsSentinelRef
  } = useVisibleItems(participants, 10);

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

  const activeTabIndex = availableTabs.findIndex((tab) => tab.key === activeTab);

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
      setSnackbar({ message: 'Не удалось сформировать ссылку. Попробуйте позже', type: 'error' });
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

    setSettingsSubmitting(true);

    try {
      const nextProject = await projectsApi.updateProject(project.id, {
        name: settingsDraft.name.trim(),
        repositoryUrl: settingsDraft.repositoryUrl.trim(),
        description: settingsDraft.description,
        stack: settingsDraft.stack,
        privacy: settingsDraft.privacy,
        aiReviewEnabled: settingsDraft.aiReviewEnabled
      });

      const fullProject = await projectsApi.getProjectById(nextProject.id, Number(userId));

      setProject(fullProject);
      setSettingsDraft({
        name: fullProject.name,
        repositoryUrl: fullProject.repositoryUrl,
        description: fullProject.description,
        stack: fullProject.stack,
        privacy: fullProject.privacy,
        aiReviewEnabled: fullProject.aiReviewEnabled
      });
      setSnackbar({ message: 'Изменения сохранены', type: 'success' });
    } catch (error) {
      if (error?.code === 'PROJECT_NAME_CONFLICT') {
        setSnackbar({ message: 'Проект с таким названием уже существует', type: 'error' });
      } else {
        setSnackbar({ message: 'Возникла непредвиденная ошибка. Попробуйте позже', type: 'error' });
      }
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleLeaveProject = async () => {
    setLeaveSubmitting(true);

    try {
      await projectsApi.leaveProject(project.id, Number(userId));
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Вы вышли из проекта',
          snackbarType: 'success'
        }
      });
    } catch {
      setSnackbar({ message: 'Не удалось выйти из проекта', type: 'error' });
    } finally {
      setLeaveSubmitting(false);
      setLeaveModalOpen(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleteSubmitting(true);

    try {
      await projectsApi.deleteProject(project.id);
      navigate(ROUTES.projects, {
        replace: true,
        state: {
          snackbarMessage: 'Проект удален',
          snackbarType: 'success'
        }
      });
    } catch {
      setSnackbar({ message: 'Не удалось удалить проект', type: 'error' });
    } finally {
      setDeleteSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="project-page">
        <Header />
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
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar({ message: '', type: 'success' })} />

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
              <span>Описание проекта: </span>
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

        <div className="project-page__tabs-wrap">
          <div className="project-page__tabs" style={{ '--tabs-count': availableTabs.length }}>
            <span
              className="project-page__tabs-slider"
              style={{ transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }}
              aria-hidden="true"
            />

            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                className={`project-page__tab ${activeTab === tab.key ? 'project-page__tab--active' : ''}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

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
                    <input type="text" placeholder="Поиск" value={taskSearch} onChange={(event) => setTaskSearch(event.target.value.slice(0, 100))} />
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

                {visibleTasks.map((task) => (
                  <div key={task.id} className="project-page__table-row">
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

                {visibleTasks.length === 0 && <p className="project-page__list-empty">Задачи не найдены</p>}
                {hasMoreTasks && <div ref={tasksSentinelRef} className="project-page__sentinel" />}
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
              {visibleParticipants.map((participant) => (
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

              {hasMoreParticipants && <div ref={participantsSentinelRef} className="project-page__sentinel" />}
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
                <ProjectSkillsSelector
                  title="Технологический стек:"
                  titleClassName="project-page__settings-title"
                  value={settingsDraft.stack}
                  onChange={(stack) => setSettingsDraft((prev) => ({ ...prev, stack }))}
                />
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

      <InviteLinkModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onGenerate={handleInviteGenerate}
        onCopySuccess={() => setSnackbar({ message: 'Ссылка скопирована в буфер обмена', type: 'success' })}
        isSubmitting={isInviteSubmitting}
      />

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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import AssigneesSelector from '../../components/AssigneesSelector/AssigneesSelector';
import ConfirmActionModal from '../../components/ConfirmActionModal/ConfirmActionModal';
import DateTimePicker from '../../components/DateTimePicker/DateTimePicker';
import EntityTabs from '../../components/EntityTabs/EntityTabs';
import Header from '../../components/Header/Header';
import { AvatarIcon, CheckIcon, CrossIcon } from '../../components/Icons/Icons';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import {
  ACCESS_ERROR_CODE,
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIVACY,
  TASK_REVIEW_TYPE,
  TASK_REVIEW_TYPE_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS
} from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { formatDeadline, getDeadlineToneClass } from '../../utils/projectFormatters';
import { validateTaskName } from '../../utils/projectValidation';
import './TaskPage.css';

const tabs = {
  solution: 'Решение',
  settings: 'Настройки'
};

const isPastDateTime = (value) => {
  if (!value) {
    return false;
  }

  const parsed = new Date(value).getTime();

  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed < Date.now();
};

const TaskPage = () => {
  const { userId } = useAuth();
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solution');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullRequirements, setShowFullRequirements] = useState(false);
  const [showFullCriteria, setShowFullCriteria] = useState(false);
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });

  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsTouched, setSettingsTouched] = useState({ name: false, deadline: false, submitted: false });
  const [isSettingsSubmitting, setSettingsSubmitting] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleteSubmitting, setDeleteSubmitting] = useState(false);

  const isOwner = task?.viewerRole === PROJECT_MEMBER_ROLE.OWNER;
  const loadTask = useCallback(async () => {
    const result = await projectsApi.getTaskById(taskId, Number(userId));
    setTask(result);
    setSettingsDraft({
      name: result.name,
      description: result.description,
      requirements: result.requirements,
      evaluationCriteria: result.evaluationCriteria,
      deadline: result.deadline,
      reviewType: result.reviewType,
      reviewerIds: result.reviewerIds,
      assigneeIds: result.assigneeIds
    });
  }, [taskId, userId]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        await loadTask();
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.status === 403 && error?.code === ACCESS_ERROR_CODE.FORBIDDEN_TASK_ASSIGNEE) {
          navigate(ROUTES.projectById.replace(':projectId', error.projectId || projectId), {
            replace: true,
            state: {
              snackbarMessage: 'Вы не являетесь исполнителем данной задачи',
              snackbarType: 'error'
            }
          });
          return;
        }

        if (error?.status === 403 && error?.code === ACCESS_ERROR_CODE.FORBIDDEN_TASK_PROJECT_MEMBER) {
          const target = error.projectPrivacy === PROJECT_PRIVACY.PUBLIC
            ? ROUTES.projectById.replace(':projectId', error.projectId || projectId)
            : ROUTES.projects;

          navigate(target, {
            replace: true,
            state: {
              snackbarMessage: 'Вы не являетесь участником проекта',
              snackbarType: 'error'
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

    load();

    return () => {
      isMounted = false;
    };
  }, [loadTask, navigate, projectId, taskId, userId]);

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
      setSnackbar({
        message: location.state.snackbarMessage,
        type: location.state.snackbarType || 'success'
      });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const availableTabs = useMemo(() => {
    const baseTabs = [{ key: 'solution', label: tabs.solution }];

    if (isOwner && task?.canManageSettings) {
      baseTabs.push({ key: 'settings', label: tabs.settings });
    }

    return baseTabs;
  }, [isOwner, task?.canManageSettings]);

  useEffect(() => {
    if (activeTab === 'settings' && !availableTabs.some((tab) => tab.key === 'settings')) {
      setActiveTab('solution');
    }
  }, [activeTab, availableTabs]);

  const nameError = useMemo(() => validateTaskName(settingsDraft?.name || ''), [settingsDraft?.name]);
  const deadlineError = useMemo(() => {
    if (!settingsDraft?.deadline) {
      return 'Выберите дедлайн';
    }

    if (isPastDateTime(settingsDraft.deadline)) {
      return 'Дедлайн не может быть в прошлом';
    }

    return '';
  }, [settingsDraft?.deadline]);

  const hasSettingsChanges = useMemo(() => {
    if (!task || !settingsDraft) {
      return false;
    }

    return (
      settingsDraft.name !== task.name ||
      settingsDraft.description !== task.description ||
      settingsDraft.requirements !== task.requirements ||
      settingsDraft.evaluationCriteria !== task.evaluationCriteria ||
      settingsDraft.deadline !== task.deadline ||
      settingsDraft.reviewType !== task.reviewType ||
      JSON.stringify(settingsDraft.reviewerIds) !== JSON.stringify(task.reviewerIds) ||
      JSON.stringify(settingsDraft.assigneeIds) !== JSON.stringify(task.assigneeIds)
    );
  }, [settingsDraft, task]);

  const canEditAllFields = task?.status === TASK_STATUS.IN_PROGRESS;
  const canEditRequirementsOnly = task?.status === TASK_STATUS.REWORK;
  const isManualReviewers = settingsDraft?.reviewType === TASK_REVIEW_TYPE.MANUAL_ASSIGNEES;

  const canSave = useMemo(() => {
    if (!task || !settingsDraft || !hasSettingsChanges) {
      return false;
    }

    if (canEditRequirementsOnly) {
      if (isManualReviewers && settingsDraft.reviewerIds.length === 0) {
        return false;
      }

      return true;
    }

    return !nameError && !deadlineError && settingsDraft.assigneeIds.length > 0 && (!isManualReviewers || settingsDraft.reviewerIds.length > 0);
  }, [canEditRequirementsOnly, deadlineError, hasSettingsChanges, isManualReviewers, nameError, settingsDraft, task]);

  const availableAssignees = useMemo(() => {
    if (!task || !settingsDraft) {
      return [];
    }

    return task.availableAssignees.filter((participant) => !settingsDraft.reviewerIds.includes(participant.id));
  }, [settingsDraft, task]);

  const availableReviewers = useMemo(() => {
    if (!task || !settingsDraft) {
      return [];
    }

    return task.availableReviewers.filter((participant) => !settingsDraft.assigneeIds.includes(participant.id));
  }, [settingsDraft, task]);

  useEffect(() => {
    if (!settingsDraft) {
      return;
    }

    if (!isManualReviewers && settingsDraft.reviewerIds.length > 0) {
      setSettingsDraft((prev) => ({ ...prev, reviewerIds: [] }));
      return;
    }

    if (!isManualReviewers) {
      return;
    }

    const availableReviewerIds = new Set(availableReviewers.map((participant) => participant.id));
    const nextReviewerIds = settingsDraft.reviewerIds.filter((id) => availableReviewerIds.has(id));

    if (nextReviewerIds.length !== settingsDraft.reviewerIds.length) {
      setSettingsDraft((prev) => ({ ...prev, reviewerIds: nextReviewerIds }));
    }
  }, [availableReviewers, isManualReviewers, settingsDraft]);

  const handleCancel = () => {
    if (!task) {
      return;
    }

    setSettingsTouched({ name: false, deadline: false, submitted: false });
    setSettingsDraft({
      name: task.name,
      description: task.description,
      requirements: task.requirements,
      evaluationCriteria: task.evaluationCriteria,
      deadline: task.deadline,
      reviewType: task.reviewType,
      reviewerIds: task.reviewerIds,
      assigneeIds: task.assigneeIds
    });
  };

  const handleSave = async () => {
    if (!task || !settingsDraft || !canSave) {
      return;
    }

    setSettingsTouched({ name: true, deadline: true, submitted: true });

    if (isManualReviewers && settingsDraft.reviewerIds.length === 0) {
      setSnackbar({ message: 'Выберите хотя бы одного ревьюера', type: 'error' });
      return;
    }

    setSettingsSubmitting(true);

    try {
      if (canEditRequirementsOnly) {
        await projectsApi.updateTask(task.id, {
          requirements: settingsDraft.requirements,
          evaluationCriteria: settingsDraft.evaluationCriteria,
          reviewType: settingsDraft.reviewType,
          reviewerIds: settingsDraft.reviewerIds
        }, Number(userId));
      } else {
        await projectsApi.updateTask(task.id, {
          name: settingsDraft.name.trim(),
          description: settingsDraft.description.trim(),
          requirements: settingsDraft.requirements.trim(),
          evaluationCriteria: settingsDraft.evaluationCriteria.trim(),
          deadline: settingsDraft.deadline,
          reviewType: settingsDraft.reviewType,
          reviewerIds: settingsDraft.reviewerIds,
          assigneeIds: settingsDraft.assigneeIds
        }, Number(userId));
      }

      await loadTask();
      setSettingsTouched({ name: false, deadline: false, submitted: false });
      setSnackbar({ message: 'Изменения сохранены', type: 'success' });
    } catch {
      setSnackbar({ message: 'Не удалось сохранить изменения', type: 'error' });
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) {
      return;
    }

    setDeleteSubmitting(true);

    try {
      await projectsApi.deleteTask(task.id, Number(userId));
      navigate(ROUTES.projectById.replace(':projectId', task.projectId), {
        replace: true,
        state: {
          snackbarMessage: 'Задача удалена',
          snackbarType: 'success'
        }
      });
    } catch {
      setSnackbar({ message: 'Не удалось удалить задачу', type: 'error' });
    } finally {
      setDeleteSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="project-page task-page">
        <Header />
        <div className="project-page__loader">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!task || !settingsDraft) {
    return null;
  }

  const description = task.description || '';
  const requirements = task.requirements || '';
  const criteria = task.evaluationCriteria || '';
  const isLongDescription = description.length > 1000;
  const isLongRequirements = requirements.length > 1000;
  const isLongCriteria = criteria.length > 1000;

  const shownDescription = isLongDescription && !showFullDescription ? `${description.slice(0, 1000)}...` : description;
  const shownRequirements = isLongRequirements && !showFullRequirements ? `${requirements.slice(0, 1000)}...` : requirements;
  const shownCriteria = isLongCriteria && !showFullCriteria ? `${criteria.slice(0, 1000)}...` : criteria;

  return (
    <div className="project-page task-page">
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar({ message: '', type: 'success' })} />

      <main className="project-page__content">
        <section className="project-page__info section-card">
          <div className="project-page__title-row">
            <div className="project-page__title-wrap">
              <h1 className="project-page__title">{task.name}</h1>
            </div>
            <span className="project-page__role-tag task-page__status-tag">{TASK_STATUS_LABELS[task.status]}</span>
          </div>

          <p className="project-page__organization">{task.projectName}</p>

          {description && (
            <p className="project-page__description">
              <span className="project-page__description-label">Описание задачи: </span>
              <span>{shownDescription}</span>
              {isLongDescription && (
                <button className="project-page__description-toggle" type="button" onClick={() => setShowFullDescription((prev) => !prev)}>
                  {showFullDescription ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {requirements && (
            <p className="project-page__description task-page__offset-section">
              <span className="project-page__description-label">Требования: </span>
              <span>{shownRequirements}</span>
              {isLongRequirements && (
                <button className="project-page__description-toggle" type="button" onClick={() => setShowFullRequirements((prev) => !prev)}>
                  {showFullRequirements ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {criteria && (
            <p className="project-page__description task-page__offset-section">
              <span className="project-page__description-label">Критерии оценки: </span>
              <span>{shownCriteria}</span>
              {isLongCriteria && (
                <button className="project-page__description-toggle" type="button" onClick={() => setShowFullCriteria((prev) => !prev)}>
                  {showFullCriteria ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          <p className="project-page__description task-page__offset-section">
            <span className="project-page__description-label">Дедлайн: </span>
            <span className={`project-page__deadline ${getDeadlineToneClass(task.deadline, task.status)}`}>{formatDeadline(task.deadline)}</span>
          </p>

          <div className="task-page__assignees-wrap task-page__offset-section">
            <h3 className="project-page__description-label">Исполнители:</h3>
            <div className="task-page__assignees-list">
              {task.assignees.map((assignee) => (
                <div key={assignee.id} className="task-page__assignee-item">
                  <span className="task-page__assignee-avatar">
                    {assignee.avatar ? <img src={assignee.avatar} alt={assignee.fullName} /> : <AvatarIcon />}
                  </span>
                  <span className="task-page__assignee-meta">
                    <span className="task-page__assignee-name">{assignee.fullName}</span>
                    <span className="task-page__assignee-login">@{assignee.login}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={setActiveTab} />

        {activeTab === 'solution' && (
          <section className="section-card task-page__solution">
            <p className="project-page__list-empty">Раздел решения пока пуст</p>
          </section>
        )}

        {activeTab === 'settings' && isOwner && settingsDraft && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                <span className="project-page__participants-count">Настройки</span>
              </div>

              <div className="project-page__controls-right">
                <button className="project-page__action-button project-page__action-button--danger" type="button" onClick={() => setDeleteModalOpen(true)}>
                  Удалить задачу
                </button>
              </div>
            </div>

            <section className="section-card project-page__settings">
              {canEditAllFields && (
                <div className="project-page__settings-field">
                  <label>Название</label>
                  <input
                    className={`project-page__settings-input ${settingsTouched.name && nameError ? 'project-page__settings-input--error' : ''}`}
                    value={settingsDraft.name}
                    onChange={(event) => setSettingsDraft((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                    onBlur={() => setSettingsTouched((prev) => ({ ...prev, name: true }))}
                    disabled={isSettingsSubmitting}
                  />
                  {settingsTouched.name && nameError && <p className="project-page__settings-error">{nameError}</p>}
                </div>
              )}

              {canEditAllFields && (
                <div className="project-page__settings-field">
                  <label>Описание</label>
                  <textarea
                    className="project-page__settings-input project-page__settings-textarea"
                    value={settingsDraft.description}
                    onChange={(event) => setSettingsDraft((prev) => ({ ...prev, description: event.target.value.slice(0, 4000) }))}
                    disabled={isSettingsSubmitting}
                  />
                </div>
              )}

              <div className="project-page__settings-field">
                <label>Требования</label>
                <textarea
                  className="project-page__settings-input project-page__settings-textarea"
                  value={settingsDraft.requirements}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, requirements: event.target.value.slice(0, 4000) }))}
                />
              </div>

              <div className="project-page__settings-field">
                <label>Критерии оценки</label>
                <textarea
                  className="project-page__settings-input project-page__settings-textarea"
                  value={settingsDraft.evaluationCriteria}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, evaluationCriteria: event.target.value.slice(0, 4000) }))}
                />
              </div>

              {canEditAllFields && (
                <div className="project-page__settings-field">
                  <label>Дедлайн</label>
                  <DateTimePicker
                    value={settingsDraft.deadline}
                    onChange={(deadline) => setSettingsDraft((prev) => ({ ...prev, deadline }))}
                    minDateTime={new Date()}
                    placeholder="Выберите дату и время"
                    hasError={Boolean(settingsTouched.deadline && deadlineError)}
                    onBlur={() => setSettingsTouched((prev) => ({ ...prev, deadline: true }))}
                    disabled={isSettingsSubmitting}
                  />
                  {settingsTouched.deadline && deadlineError && <p className="project-page__settings-error">{deadlineError}</p>}
                </div>
              )}

              <div className="project-page__settings-field">
                <h3 className="task-page__review-title">Тип ревью</h3>
                <div className="task-page__review-list">
                  {Object.values(TASK_REVIEW_TYPE).map((type) => (
                    <label key={type} className="task-page__review-item">
                      <input
                        type="radio"
                        checked={settingsDraft.reviewType === type}
                        onChange={() => setSettingsDraft((prev) => ({ ...prev, reviewType: type }))}
                        disabled={isSettingsSubmitting}
                      />
                      <span>{TASK_REVIEW_TYPE_LABELS[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isManualReviewers && (
                <div className="project-page__settings-field">
                  <AssigneesSelector
                    title="Ревьюеры"
                    users={availableReviewers}
                    selectedUserIds={settingsDraft.reviewerIds}
                    onChange={(reviewerIds) => setSettingsDraft((prev) => ({ ...prev, reviewerIds }))}
                    disabled={isSettingsSubmitting}
                  />
                </div>
              )}

              {canEditAllFields && (
                <div className="project-page__settings-field">
                  <AssigneesSelector
                    users={availableAssignees}
                    selectedUserIds={settingsDraft.assigneeIds}
                    onChange={(assigneeIds) => setSettingsDraft((prev) => ({ ...prev, assigneeIds }))}
                    disabled={isSettingsSubmitting}
                  />
                </div>
              )}

              {hasSettingsChanges && (
                <div className="project-page__settings-actions">
                  <button
                    className="project-page__settings-action project-page__settings-action--save"
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave || isSettingsSubmitting}
                    aria-label="Сохранить изменения"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    className="project-page__settings-action project-page__settings-action--cancel"
                    type="button"
                    onClick={handleCancel}
                    aria-label="Отменить изменения"
                    disabled={isSettingsSubmitting}
                  >
                    <CrossIcon />
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <ConfirmActionModal
        isOpen={isDeleteModalOpen}
        title="Удаление задачи"
        description="Задача будет удалена без возможности восстановления"
        confirmLabel="Удалить"
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isSubmitting={isDeleteSubmitting}
        isDeleteAction
      />
    </div>
  );
};

export default TaskPage;

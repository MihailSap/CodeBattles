import { Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteTaskMutation,
  useGetProjectByIdQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation
} from '@/entities/project';
import ConfirmActionModal from '@/shared/ui/confirm-action-modal';
import EntityTabs from '@/shared/ui/entity-tabs';
import { AvatarIcon, CheckIcon, CrossIcon } from '@/shared/ui/icons';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import {
  ACCESS_ERROR_CODE,
  PROJECT_MEMBER_ROLE,
  PROJECT_PRIVACY,
  TASK_REVIEW_TYPE,
  TASK_REVIEW_TYPE_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS
} from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { useSnackbar } from '@/shared/lib/hooks';
import { lazyNamed } from '@/shared/lib';
import { formatDeadline, getDeadlineToneClass } from '@/entities/project';
import { validateTaskName } from '@/entities/project';
import './TaskPage.css';

const AssigneesSelector = lazyNamed(() => import('@/features/manage-task'), 'AssigneesSelector');
const SolutionTab = lazyNamed(() => import('@/widgets/solution-workspace'), 'SolutionTab');
const DateTimePicker = lazyNamed(() => import('@/shared/ui/date-time-picker'), 'default');

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
  const { userId, user } = useAuth();
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('solution');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullRequirements, setShowFullRequirements] = useState(false);
  const [showFullCriteria, setShowFullCriteria] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();

  const [settingsDraft, setSettingsDraft] = useState(null);
  const [settingsTouched, setSettingsTouched] = useState({ name: false, deadline: false, submitted: false });
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const {
    data: task,
    error: taskError,
    isLoading: isTaskLoading,
    refetch: refetchTask
  } = useGetTaskByIdQuery({ projectId, taskId }, { refetchOnMountOrArgChange: 30 });
  const {
    data: project = null,
    isLoading: isProjectLoading
  } = useGetProjectByIdQuery(projectId, { refetchOnMountOrArgChange: 30 });
  const [updateTask, { isLoading: isSettingsSubmitting }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleteSubmitting }] = useDeleteTaskMutation();
  const isLoading = isTaskLoading || isProjectLoading;

  const isAdmin = user?.role === 'ADMIN';
  const isOwner = (project?.viewerRole || task?.viewerRole) === PROJECT_MEMBER_ROLE.OWNER;
  const isTaskAssignee = task?.assigneeIds?.includes(Number(userId));
  const isTaskReviewer = task?.reviewerIds?.includes(Number(userId));
  const isAdminReadOnlyView = isAdmin && !isOwner && !isTaskAssignee && !isTaskReviewer;
  const canManageTask = isOwner && !isAdminReadOnlyView;
  const canViewSettings = isOwner || isAdminReadOnlyView;
  const shouldShowSolutionTab = task?.isMock !== false;

  useEffect(() => {
    if (!task) {
      return;
    }

    queueMicrotask(() => setSettingsDraft({
      name: task.name,
      description: task.description,
      requirements: task.requirements,
      evaluationCriteria: task.evaluationCriteria,
      deadline: task.deadline,
      reviewType: task.reviewType,
      reviewerIds: task.reviewerIds,
      assigneeIds: task.assigneeIds
    }));
  }, [task]);

  useEffect(() => {
    if (!taskError) {
      return;
    }

    if (taskError?.status === 403 && taskError?.code === ACCESS_ERROR_CODE.FORBIDDEN_TASK_ASSIGNEE) {
      navigate(ROUTES.projectById.replace(':projectId', taskError.projectId || projectId), {
        replace: true,
        state: {
          snackbarMessage: 'Вы не являетесь исполнителем данной задачи',
          snackbarType: 'error'
        }
      });
      return;
    }

    if (taskError?.status === 403 && taskError?.code === ACCESS_ERROR_CODE.FORBIDDEN_TASK_PROJECT_MEMBER) {
      const target = taskError.projectPrivacy === PROJECT_PRIVACY.PUBLIC
        ? ROUTES.projectById.replace(':projectId', taskError.projectId || projectId)
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
  }, [navigate, projectId, taskError]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, showSnackbar]);

  const availableTabs = useMemo(() => {
    const baseTabs = [{ key: 'solution', label: tabs.solution }];

    if (canViewSettings) {
      baseTabs.push({ key: 'settings', label: tabs.settings });
    }

    return baseTabs;
  }, [canViewSettings]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((tab) => tab.key === activeTab)) {
      queueMicrotask(() => setActiveTab(availableTabs[0].key));
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
    if (!task || !settingsDraft || !hasSettingsChanges || !canManageTask) {
      return false;
    }

    if (canEditRequirementsOnly) {
      if (isManualReviewers && settingsDraft.reviewerIds.length === 0) {
        return false;
      }

      return true;
    }

    return !nameError && !deadlineError && settingsDraft.assigneeIds.length > 0 && (!isManualReviewers || settingsDraft.reviewerIds.length > 0);
  }, [canEditRequirementsOnly, canManageTask, deadlineError, hasSettingsChanges, isManualReviewers, nameError, settingsDraft, task]);

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

  const reviewTypes = useMemo(() => {
    const types = Object.values(TASK_REVIEW_TYPE);
    return (project?.aiReviewEnabled ?? task?.aiReviewEnabled)
      ? types
      : types.filter((type) => type !== TASK_REVIEW_TYPE.AI_ONLY);
  }, [project?.aiReviewEnabled, task?.aiReviewEnabled]);

  useEffect(() => {
    if (!settingsDraft) {
      return;
    }

    if (!isManualReviewers && settingsDraft.reviewerIds.length > 0) {
      queueMicrotask(() => setSettingsDraft((prev) => ({ ...prev, reviewerIds: [] })));
      return;
    }

    if (!isManualReviewers) {
      return;
    }

    const availableReviewerIds = new Set(availableReviewers.map((participant) => participant.id));
    const nextReviewerIds = settingsDraft.reviewerIds.filter((id) => availableReviewerIds.has(id));

    if (nextReviewerIds.length !== settingsDraft.reviewerIds.length) {
      queueMicrotask(() => setSettingsDraft((prev) => ({ ...prev, reviewerIds: nextReviewerIds })));
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
      showSnackbar('Выберите хотя бы одного ревьюера', 'error');
      return;
    }

    try {
      if (canEditRequirementsOnly) {
        await updateTask({
          taskId: task.id,
          projectId: task.projectId,
          payload: {
            requirements: settingsDraft.requirements,
            evaluationCriteria: settingsDraft.evaluationCriteria,
            reviewType: settingsDraft.reviewType,
            reviewerIds: settingsDraft.reviewerIds
          }
        }).unwrap();
      } else {
        await updateTask({
          taskId: task.id,
          projectId: task.projectId,
          payload: {
            name: settingsDraft.name.trim(),
            description: settingsDraft.description.trim(),
            requirements: settingsDraft.requirements.trim(),
            evaluationCriteria: settingsDraft.evaluationCriteria.trim(),
            deadline: settingsDraft.deadline,
            reviewType: settingsDraft.reviewType,
            reviewerIds: settingsDraft.reviewerIds,
            assigneeIds: settingsDraft.assigneeIds
          }
        }).unwrap();
      }

      await refetchTask();
      setSettingsTouched({ name: false, deadline: false, submitted: false });
      showSnackbar('Изменения сохранены', 'success');
    } catch {
      showSnackbar('Не удалось сохранить изменения', 'error');
    }
  };

  const handleDelete = async () => {
    if (!task) {
      return;
    }

    try {
      await deleteTask({ taskId: task.id, projectId: task.projectId }).unwrap();
      navigate(ROUTES.projectById.replace(':projectId', task.projectId), {
        replace: true,
        state: {
          snackbarMessage: 'Задача удалена',
          snackbarType: 'success'
        }
      });
    } catch {
      showSnackbar('Не удалось удалить задачу', 'error');
    }
    setDeleteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="project-page task-page">
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
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className="project-page__content task-page-content">
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

        {availableTabs.length > 0 && <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={setActiveTab} />}

        {activeTab === 'solution' && shouldShowSolutionTab && (
          <Suspense fallback={<div className="project-page__loader"><Spinner /></div>}>
            <SolutionTab
              task={task}
              currentUser={{ id: Number(userId), fullName: 'Мой Пользователь' }}
              aiReviewEnabled={project?.aiReviewEnabled ?? task.aiReviewEnabled}
              onSnackbar={showSnackbar}
              projectId={projectId}
              readOnly={isAdminReadOnlyView}
            />
          </Suspense>
        )}

        {activeTab === 'settings' && canViewSettings && settingsDraft && (
          <>
            <div className="project-page__controls">
              <div className="project-page__controls-left">
                <span className="project-page__participants-count">
                  {isAdminReadOnlyView ? 'Настройки: просмотр администратора' : 'Настройки'}
                </span>
              </div>

              {canManageTask && (
                <div className="project-page__controls-right">
                  <button className="project-page__action-button project-page__action-button--danger" type="button" onClick={() => setDeleteModalOpen(true)}>
                    Удалить задачу
                  </button>
                </div>
              )}
            </div>

            <section className="section-card project-page__settings">
              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className="project-page__settings-field">
                  <label>Название</label>
                  <input
                    className={`project-page__settings-input ${settingsTouched.name && nameError ? 'project-page__settings-input--error' : ''}`}
                    value={settingsDraft.name}
                    onChange={(event) => setSettingsDraft((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                    onBlur={() => setSettingsTouched((prev) => ({ ...prev, name: true }))}
                    disabled={!canManageTask || isSettingsSubmitting}
                  />
                  {settingsTouched.name && nameError && <p className="project-page__settings-error">{nameError}</p>}
                </div>
              )}

              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className="project-page__settings-field">
                  <label>Описание</label>
                  <textarea
                    className="project-page__settings-input project-page__settings-textarea"
                    value={settingsDraft.description}
                    onChange={(event) => setSettingsDraft((prev) => ({ ...prev, description: event.target.value.slice(0, 4000) }))}
                    disabled={!canManageTask || isSettingsSubmitting}
                  />
                </div>
              )}

              <div className="project-page__settings-field">
                <label>Требования</label>
                <textarea
                  className="project-page__settings-input project-page__settings-textarea"
                  value={settingsDraft.requirements}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, requirements: event.target.value.slice(0, 4000) }))}
                  disabled={!canManageTask || isSettingsSubmitting}
                />
              </div>

              <div className="project-page__settings-field">
                <label>Критерии оценки</label>
                <textarea
                  className="project-page__settings-input project-page__settings-textarea"
                  value={settingsDraft.evaluationCriteria}
                  onChange={(event) => setSettingsDraft((prev) => ({ ...prev, evaluationCriteria: event.target.value.slice(0, 4000) }))}
                  disabled={!canManageTask || isSettingsSubmitting}
                />
              </div>

              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className="project-page__settings-field">
                  <label>Дедлайн</label>
                  <Suspense fallback={null}>
                    <DateTimePicker
                      value={settingsDraft.deadline}
                      onChange={(deadline) => setSettingsDraft((prev) => ({ ...prev, deadline }))}
                      minDateTime={new Date()}
                      placeholder="Выберите дату и время"
                      hasError={Boolean(settingsTouched.deadline && deadlineError)}
                      onBlur={() => setSettingsTouched((prev) => ({ ...prev, deadline: true }))}
                      disabled={!canManageTask || isSettingsSubmitting}
                    />
                  </Suspense>
                  {settingsTouched.deadline && deadlineError && <p className="project-page__settings-error">{deadlineError}</p>}
                </div>
              )}

              <div className="project-page__settings-field">
                <h3 className="task-page__review-title">Тип ревью</h3>
                <div className="task-page__review-list">
                  {reviewTypes.map((type) => (
                    <label key={type} className="task-page__review-item">
                      <input
                        type="radio"
                        checked={settingsDraft.reviewType === type}
                        onChange={() => setSettingsDraft((prev) => ({ ...prev, reviewType: type }))}
                        disabled={!canManageTask || isSettingsSubmitting}
                      />
                      <span>{TASK_REVIEW_TYPE_LABELS[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isManualReviewers && (
                <div className="project-page__settings-field">
                  <Suspense fallback={null}>
                    <AssigneesSelector
                      title="Ревьюеры"
                      users={availableReviewers}
                      selectedUserIds={settingsDraft.reviewerIds}
                      onChange={(reviewerIds) => setSettingsDraft((prev) => ({ ...prev, reviewerIds }))}
                      disabled={!canManageTask || isSettingsSubmitting}
                    />
                  </Suspense>
                </div>
              )}

              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className="project-page__settings-field">
                  <Suspense fallback={null}>
                    <AssigneesSelector
                      users={availableAssignees}
                      selectedUserIds={settingsDraft.assigneeIds}
                      onChange={(assigneeIds) => setSettingsDraft((prev) => ({ ...prev, assigneeIds }))}
                      disabled={!canManageTask || isSettingsSubmitting}
                    />
                  </Suspense>
                </div>
              )}

              {canManageTask && hasSettingsChanges && (
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

import { zodResolver } from '@hookform/resolvers/zod';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteTaskMutation,
  useGetProjectByIdQuery,
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
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
  TASK_STATUS_LABELS,
  taskSettingsFormSchema,
} from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { useSnackbar } from '@/shared/lib/hooks';
import { lazyNamed } from '@/shared/lib';
import { formatDeadline, getDeadlineToneClass } from '@/entities/project';
import taskPageStyles from './TaskPage.module.scss';
import projectPageStyles from '../../project/ui/ProjectPage.module.scss';
type AccessErrorShape = {
  status?: number;
  code?: string;
  projectId?: string;
  projectPrivacy?: string;
};

const isAccessErrorShape = (value: unknown): value is AccessErrorShape =>
  typeof value === 'object' && value !== null;


const AssigneesSelector = lazyNamed(() => import('@/features/manage-task'), 'AssigneesSelector');
const SolutionTab = lazyNamed(() => import('@/widgets/solution-workspace'), 'SolutionTab');
const DateTimePicker = lazyNamed(() => import('@/shared/ui/date-time-picker'), 'default');

const tabs = {
  solution: 'Решение',
  settings: 'Настройки',
};

const isPastDateTime = (value: LegacyValue) => {
  if (!value) {
    return false;
  }

  const parsed = new Date(value).getTime();

  if (Number.isNaN(parsed)) {
    return true;
  }

  return parsed < Date.now();
};

const DEADLINE_TONE_CLASS = {
  success: projectPageStyles.isSuccess,
  warning: projectPageStyles.isWarning,
  error: projectPageStyles.isError,
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

  const {
    control: settingsControl,
    register: registerSettings,
    handleSubmit: handleSettingsSubmit,
    reset: resetSettings,
    setValue: setSettingsValue,
    formState: {
      errors: settingsErrors,
      isSubmitted: isSettingsSubmitted,
      isValid: isSettingsValid,
      touchedFields: settingsTouchedFields,
    },
  } = useForm({
    resolver: zodResolver(taskSettingsFormSchema),
    defaultValues: {
      name: '',
      description: '',
      requirements: '',
      evaluationCriteria: '',
      deadline: '',
      reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
      reviewerIds: [],
      assigneeIds: [],
    },
    mode: 'onChange',
  });

  const settingsDraft = useWatch({
    control: settingsControl,
  });

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    data: task,
    error: taskError,
    isLoading: isTaskLoading,
    refetch: refetchTask,
  } = useGetTaskByIdQuery(
    {
      projectId,
      taskId,
    },
    {
      refetchOnMountOrArgChange: 30,
    }
  );

  const { data: project = null, isLoading: isProjectLoading } = useGetProjectByIdQuery(projectId, {
    refetchOnMountOrArgChange: 30,
  });

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

    queueMicrotask(() =>
      resetSettings({
        name: task.name,
        description: task.description,
        requirements: task.requirements,
        evaluationCriteria: task.evaluationCriteria,
        deadline: task.deadline,
        reviewType: task.reviewType,
        reviewerIds: task.reviewerIds,
        assigneeIds: task.assigneeIds,
      })
    );
  }, [resetSettings, task]);

  useEffect(() => {
    if (!taskError) {
      return;
    }

    const accessError = isAccessErrorShape(taskError) ? taskError : undefined;

    if (accessError?.status === 403 && accessError?.code === ACCESS_ERROR_CODE.FORBIDDEN_TASK_ASSIGNEE) {
      navigate(ROUTES.projectById.replace(':projectId', accessError?.projectId || projectId || ''), {
        replace: true,
        state: {
          snackbarMessage: 'Вы не являетесь исполнителем данной задачи',
          snackbarType: 'error',
        },
      });

      return;
    }

    if (accessError?.status === 403 && accessError?.code === ACCESS_ERROR_CODE.FORBIDDEN_TASK_PROJECT_MEMBER) {
      const target =
        accessError?.projectPrivacy === PROJECT_PRIVACY.PUBLIC
          ? ROUTES.projectById.replace(':projectId', accessError?.projectId || projectId || '')
          : ROUTES.projects;

      navigate(target, {
        replace: true,
        state: {
          snackbarMessage: 'Вы не являетесь участником проекта',
          snackbarType: 'error',
        },
      });

      return;
    }

    navigate(ROUTES.projects, {
      replace: true,
    });
  }, [navigate, projectId, taskError]);

  useEffect(() => {
    if (location.state?.snackbarMessage) {
      showSnackbar(location.state.snackbarMessage, location.state.snackbarType || 'success');

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.state, navigate, showSnackbar]);

  const availableTabs = useMemo(() => {
    const baseTabs = [
      {
        key: 'solution',
        label: tabs.solution,
      },
    ];

    if (canViewSettings) {
      baseTabs.push({
        key: 'settings',
        label: tabs.settings,
      });
    }

    return baseTabs;
  }, [canViewSettings]);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((tab: LegacyValue) => tab.key === activeTab)) {
      queueMicrotask(() => setActiveTab(availableTabs[0].key));
    }
  }, [activeTab, availableTabs]);

  const getSettingsError = (fieldName: LegacyValue) => {
    if (!((settingsTouchedFields as LegacyValue)[fieldName] || isSettingsSubmitted)) {
      return '';
    }

    return String((settingsErrors as LegacyValue)[fieldName]?.message || '');
  };

  const nameError = getSettingsError('name');

  const deadlineError = useMemo(() => {
    if (!settingsDraft?.deadline) {
      return 'Выберите дедлайн';
    }

    if (isPastDateTime(settingsDraft.deadline)) {
      return 'Дедлайн не может быть в прошлом';
    }

    return '';
  }, [settingsDraft]);

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
  const draftAssigneeIds = useMemo(() => settingsDraft?.assigneeIds || [], [settingsDraft?.assigneeIds]);
  const draftReviewerIds = useMemo(() => settingsDraft?.reviewerIds || [], [settingsDraft?.reviewerIds]);

  const canSave = useMemo(() => {
    if (!task || !settingsDraft || !hasSettingsChanges || !canManageTask) {
      return false;
    }

    if (canEditRequirementsOnly) {
      if (isManualReviewers && draftReviewerIds.length === 0) {
        return false;
      }

      return true;
    }

    return (
      isSettingsValid &&
      !nameError &&
      !deadlineError &&
      draftAssigneeIds.length > 0 &&
      (!isManualReviewers || draftReviewerIds.length > 0)
    );
  }, [
    canEditRequirementsOnly,
    canManageTask,
    draftAssigneeIds.length,
    draftReviewerIds.length,
    deadlineError,
    hasSettingsChanges,
    isManualReviewers,
    isSettingsValid,
    nameError,
    settingsDraft,
    task,
  ]);

  const availableAssignees = useMemo(() => {
    if (!task || !settingsDraft) {
      return [];
    }

    return task.availableAssignees.filter((participant: LegacyValue) => !draftReviewerIds.includes(participant.id));
  }, [draftReviewerIds, settingsDraft, task]);

  const availableReviewers = useMemo(() => {
    if (!task || !settingsDraft) {
      return [];
    }

    return task.availableReviewers.filter((participant: LegacyValue) => !draftAssigneeIds.includes(participant.id));
  }, [draftAssigneeIds, settingsDraft, task]);

  const reviewTypes = useMemo(() => {
    const types = Object.values(TASK_REVIEW_TYPE);

    return (project?.aiReviewEnabled ?? task?.aiReviewEnabled)
      ? types
      : types.filter((type: LegacyValue) => type !== TASK_REVIEW_TYPE.AI_ONLY);
  }, [project?.aiReviewEnabled, task?.aiReviewEnabled]);

  useEffect(() => {
    if (!settingsDraft) {
      return;
    }

    if (!isManualReviewers && draftReviewerIds.length > 0) {
      queueMicrotask(() =>
        setSettingsValue('reviewerIds', [], {
          shouldDirty: true,
          shouldValidate: true,
        })
      );

      return;
    }

    if (!isManualReviewers) {
      return;
    }

    const availableReviewerIds = new Set(availableReviewers.map((participant: LegacyValue) => participant.id));
    const nextReviewerIds = draftReviewerIds.filter((id: LegacyValue) => availableReviewerIds.has(id));

    if (nextReviewerIds.length !== draftReviewerIds.length) {
      queueMicrotask(() =>
        setSettingsValue('reviewerIds', nextReviewerIds, {
          shouldDirty: true,
          shouldValidate: true,
        })
      );
    }
  }, [availableReviewers, draftReviewerIds, isManualReviewers, setSettingsValue, settingsDraft]);

  const handleCancel = () => {
    if (!task) {
      return;
    }

    resetSettings({
      name: task.name,
      description: task.description,
      requirements: task.requirements,
      evaluationCriteria: task.evaluationCriteria,
      deadline: task.deadline,
      reviewType: task.reviewType,
      reviewerIds: task.reviewerIds,
      assigneeIds: task.assigneeIds,
    });
  };

  const saveSettings = async (settingsDraft: LegacyValue) => {
    if (!task || !settingsDraft || !canSave) {
      return;
    }

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
            reviewerIds: settingsDraft.reviewerIds,
          },
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
            assigneeIds: settingsDraft.assigneeIds,
          },
        }).unwrap();
      }

      const updatedTask = await refetchTask().unwrap();

      resetSettings({
        name: updatedTask.name,
        description: updatedTask.description,
        requirements: updatedTask.requirements,
        evaluationCriteria: updatedTask.evaluationCriteria,
        deadline: updatedTask.deadline,
        reviewType: updatedTask.reviewType,
        reviewerIds: updatedTask.reviewerIds,
        assigneeIds: updatedTask.assigneeIds,
      });

      showSnackbar('Изменения сохранены', 'success');
    } catch {
      showSnackbar('Не удалось сохранить изменения', 'error');
    }
  };

  const handleSave = handleSettingsSubmit(saveSettings);

  const handleDelete = async () => {
    if (!task) {
      return;
    }

    try {
      await deleteTask({
        taskId: task.id,
        projectId: task.projectId,
      }).unwrap();

      navigate(ROUTES.projectById.replace(':projectId', task.projectId), {
        replace: true,
        state: {
          snackbarMessage: 'Задача удалена',
          snackbarType: 'success',
        },
      });
    } catch {
      showSnackbar('Не удалось удалить задачу', 'error');
    }

    setDeleteModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className={[projectPageStyles.root, taskPageStyles.root].join(' ')}>
        <div className={projectPageStyles.loader}>
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

  const shownRequirements =
    isLongRequirements && !showFullRequirements ? `${requirements.slice(0, 1000)}...` : requirements;

  const shownCriteria = isLongCriteria && !showFullCriteria ? `${criteria.slice(0, 1000)}...` : criteria;

  return (
    <div className={[projectPageStyles.root, taskPageStyles.root].join(' ')}>
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className={[projectPageStyles.content, taskPageStyles.content2].join(' ')}>
        <section className={[projectPageStyles.info, projectPageStyles.sectionCard].join(' ')}>
          <div className={projectPageStyles.titleRow}>
            <div className={projectPageStyles.titleWrap}>
              <h1 className={projectPageStyles.title}>{task.name}</h1>
            </div>
            <span className={[projectPageStyles.roleTag, taskPageStyles.statusTag].join(' ')}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
          </div>

          <p className={projectPageStyles.organization}>{task.projectName}</p>

          {description && (
            <p className={projectPageStyles.description}>
              <span className={projectPageStyles.descriptionLabel}>Описание задачи: </span>
              <span>{shownDescription}</span>
              {isLongDescription && (
                <button
                  className={projectPageStyles.descriptionToggle}
                  type="button"
                  onClick={() => setShowFullDescription((prev: LegacyValue) => !prev)}
                >
                  {showFullDescription ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {requirements && (
            <p className={[projectPageStyles.description, taskPageStyles.offsetSection].join(' ')}>
              <span className={projectPageStyles.descriptionLabel}>Требования: </span>
              <span>{shownRequirements}</span>
              {isLongRequirements && (
                <button
                  className={projectPageStyles.descriptionToggle}
                  type="button"
                  onClick={() => setShowFullRequirements((prev: LegacyValue) => !prev)}
                >
                  {showFullRequirements ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          {criteria && (
            <p className={[projectPageStyles.description, taskPageStyles.offsetSection].join(' ')}>
              <span className={projectPageStyles.descriptionLabel}>Критерии оценки: </span>
              <span>{shownCriteria}</span>
              {isLongCriteria && (
                <button
                  className={projectPageStyles.descriptionToggle}
                  type="button"
                  onClick={() => setShowFullCriteria((prev: LegacyValue) => !prev)}
                >
                  {showFullCriteria ? 'Свернуть' : 'Развернуть'}
                </button>
              )}
            </p>
          )}

          <p className={[projectPageStyles.description, taskPageStyles.offsetSection].join(' ')}>
            <span className={projectPageStyles.descriptionLabel}>Дедлайн: </span>
            <span
              className={[
                projectPageStyles.deadline,
                (DEADLINE_TONE_CLASS as LegacyValue)[getDeadlineToneClass(task.deadline, task.status)],
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {formatDeadline(task.deadline)}
            </span>
          </p>

          <div className={[taskPageStyles.assigneesWrap, taskPageStyles.offsetSection].join(' ')}>
            <h3 className={projectPageStyles.descriptionLabel}>Исполнители:</h3>
            <div className={taskPageStyles.assigneesList}>
              {task.assignees.map((assignee: LegacyValue) => (
                <div key={assignee.id} className={taskPageStyles.assigneeItem}>
                  <span className={taskPageStyles.assigneeAvatar}>
                    {assignee.avatar ? <img src={assignee.avatar} alt={assignee.fullName} /> : <AvatarIcon />}
                  </span>
                  <span className={taskPageStyles.assigneeMeta}>
                    <span className={taskPageStyles.assigneeName}>{assignee.fullName}</span>
                    <span className={taskPageStyles.assigneeLogin}>@{assignee.login}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {availableTabs.length > 0 && <EntityTabs tabs={availableTabs} activeKey={activeTab} onChange={setActiveTab} />}

        {activeTab === 'solution' && shouldShowSolutionTab && (
          <Suspense
            fallback={
              <div className={projectPageStyles.loader}>
                <Spinner />
              </div>
            }
          >
            <SolutionTab
              task={task}
              currentUser={{
                id: Number(userId),
                fullName: 'Мой Пользователь',
              }}
              aiReviewEnabled={project?.aiReviewEnabled ?? task.aiReviewEnabled}
              onSnackbar={showSnackbar}
              projectId={projectId}
              readOnly={isAdminReadOnlyView}
            />
          </Suspense>
        )}

        {activeTab === 'settings' && canViewSettings && settingsDraft && (
          <>
            <div className={projectPageStyles.controls}>
              <div className={projectPageStyles.controlsLeft}>
                <span className={projectPageStyles.participantsCount}>
                  {isAdminReadOnlyView ? 'Настройки: просмотр администратора' : 'Настройки'}
                </span>
              </div>

              {canManageTask && (
                <div className={projectPageStyles.controlsRight}>
                  <button
                    className={[projectPageStyles.actionButton, projectPageStyles.isDanger].join(' ')}
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    Удалить задачу
                  </button>
                </div>
              )}
            </div>

            <form
              className={[projectPageStyles.sectionCard, projectPageStyles.settings].join(' ')}
              onSubmit={handleSave}
            >
              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className={projectPageStyles.settingsField}>
                  <label>Название</label>
                  <input
                    className={[projectPageStyles.settingsInput, nameError ? projectPageStyles.settingsInputError : '']
                      .filter(Boolean)
                      .join(' ')}
                    maxLength={100}
                    disabled={!canManageTask || isSettingsSubmitting}
                    {...registerSettings('name')}
                  />
                  {nameError && <p className={projectPageStyles.settingsError}>{nameError}</p>}
                </div>
              )}

              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className={projectPageStyles.settingsField}>
                  <label>Описание</label>
                  <textarea
                    className={[projectPageStyles.settingsInput, projectPageStyles.settingsTextarea].join(' ')}
                    maxLength={4000}
                    disabled={!canManageTask || isSettingsSubmitting}
                    {...registerSettings('description')}
                  />
                </div>
              )}

              <div className={projectPageStyles.settingsField}>
                <label>Требования</label>
                <textarea
                  className={[projectPageStyles.settingsInput, projectPageStyles.settingsTextarea].join(' ')}
                  maxLength={4000}
                  disabled={!canManageTask || isSettingsSubmitting}
                  {...registerSettings('requirements')}
                />
              </div>

              <div className={projectPageStyles.settingsField}>
                <label>Критерии оценки</label>
                <textarea
                  className={[projectPageStyles.settingsInput, projectPageStyles.settingsTextarea].join(' ')}
                  maxLength={4000}
                  disabled={!canManageTask || isSettingsSubmitting}
                  {...registerSettings('evaluationCriteria')}
                />
              </div>

              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className={projectPageStyles.settingsField}>
                  <label>Дедлайн</label>
                  <Suspense fallback={null}>
                    <Controller
                      control={settingsControl}
                      name="deadline"
                      render={({ field }: LegacyValue) => (
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          minDateTime={new Date()}
                          placeholder="Выберите дату и время"
                          hasError={Boolean(settingsTouchedFields.deadline && deadlineError)}
                          onBlur={field.onBlur}
                          disabled={!canManageTask || isSettingsSubmitting}
                        />
                      )}
                    />
                  </Suspense>
                  {(settingsTouchedFields.deadline || isSettingsSubmitted) && deadlineError && (
                    <p className={projectPageStyles.settingsError}>{deadlineError}</p>
                  )}
                </div>
              )}

              <div className={projectPageStyles.settingsField}>
                <h3 className={taskPageStyles.reviewTitle}>Тип ревью</h3>
                <div className={taskPageStyles.reviewList}>
                  {reviewTypes.map((type: LegacyValue) => (
                    <label key={type} className={taskPageStyles.reviewItem}>
                      <input
                        type="radio"
                        value={type}
                        disabled={!canManageTask || isSettingsSubmitting}
                        {...registerSettings('reviewType')}
                      />
                      <span>{TASK_REVIEW_TYPE_LABELS[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {isManualReviewers && (
                <div className={projectPageStyles.settingsField}>
                  <Suspense fallback={null}>
                    <Controller
                      control={settingsControl}
                      name="reviewerIds"
                      render={({ field }: LegacyValue) => (
                        <AssigneesSelector
                          title="Ревьюеры"
                          users={availableReviewers}
                          selectedUserIds={field.value}
                          onChange={field.onChange}
                          disabled={!canManageTask || isSettingsSubmitting}
                        />
                      )}
                    />
                  </Suspense>
                </div>
              )}

              {(canEditAllFields || isAdminReadOnlyView) && (
                <div className={projectPageStyles.settingsField}>
                  <Suspense fallback={null}>
                    <Controller
                      control={settingsControl}
                      name="assigneeIds"
                      render={({ field }: LegacyValue) => (
                        <AssigneesSelector
                          users={availableAssignees}
                          selectedUserIds={field.value}
                          onChange={field.onChange}
                          disabled={!canManageTask || isSettingsSubmitting}
                        />
                      )}
                    />
                  </Suspense>
                </div>
              )}

              {canManageTask && hasSettingsChanges && (
                <div className={projectPageStyles.settingsActions}>
                  <button
                    className={[projectPageStyles.settingsAction, projectPageStyles.isSave].join(' ')}
                    type="submit"
                    disabled={!canSave || isSettingsSubmitting}
                    aria-label="Сохранить изменения"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    className={[projectPageStyles.settingsAction, projectPageStyles.isCancel].join(' ')}
                    type="button"
                    onClick={handleCancel}
                    aria-label="Отменить изменения"
                    disabled={isSettingsSubmitting}
                  >
                    <CrossIcon />
                  </button>
                </div>
              )}
            </form>
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

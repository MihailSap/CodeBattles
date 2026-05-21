import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateTaskMutation, useGetOrganizationByIdQuery, useGetProjectByIdQuery } from '@/entities/project';
import { AssigneesSelector } from '@/features/manage-task';
import DateTimePicker from '@/shared/ui/date-time-picker';
import { CheckIcon } from '@/shared/ui/icons';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import { PROJECT_PRIVACY, TASK_REVIEW_TYPE, TASK_REVIEW_TYPE_LABELS, taskCreateFormSchema } from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useSnackbar } from '@/shared/lib/hooks';
import './TaskCreatePage.css';

const initialState = {
  name: '',
  description: '',
  requirements: '',
  evaluationCriteria: '',
  deadline: '',
  reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
  assigneeIds: [],
  reviewerIds: [],
};

const TaskCreatePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(taskCreateFormSchema),
    defaultValues: initialState,
    mode: 'onChange',
  });
  const [reviewType = TASK_REVIEW_TYPE.MANUAL_ASSIGNEES, assigneeIds = [], reviewerIds = []] = useWatch({
    control,
    name: ['reviewType', 'assigneeIds', 'reviewerIds'],
  });
  const {
    data: project,
    error: projectError,
    isLoading: isProjectLoading,
  } = useGetProjectByIdQuery(projectId, {
    refetchOnMountOrArgChange: 30,
  });
  const shouldLoadOrganization = Boolean(project?.organizationId && project.privacy === PROJECT_PRIVACY.PUBLIC);
  const { data: organization, isLoading: isOrganizationLoading } = useGetOrganizationByIdQuery(
    project?.organizationId,
    {
      skip: !shouldLoadOrganization,
      refetchOnMountOrArgChange: 60,
    }
  );
  const [createTask, { isLoading: isSubmitting }] = useCreateTaskMutation();
  const organizationParticipants = useMemo(() => organization?.participants || [], [organization?.participants]);
  const isLoading = isProjectLoading || (shouldLoadOrganization && isOrganizationLoading);

  useEffect(() => {
    if (projectError) {
      navigate(ROUTES.projects, { replace: true });
    }
  }, [navigate, projectError]);

  useEffect(() => {
    if (project && project.viewerRole !== 'OWNER') {
      navigate(`${ROUTES.projects}/${projectId}`, { replace: true });
    }
  }, [navigate, project, projectId]);

  const nowMin = useMemo(() => new Date(), []);
  const isManualReviewers = reviewType === TASK_REVIEW_TYPE.MANUAL_ASSIGNEES;

  const reviewersSource = useMemo(() => {
    if (!project) {
      return [];
    }

    if (!project.organizationId) {
      return project.participants;
    }

    if (project.privacy === PROJECT_PRIVACY.PUBLIC) {
      return organizationParticipants;
    }

    return project.participants;
  }, [organizationParticipants, project]);

  const availableAssignees = useMemo(
    () => project?.participants.filter((participant) => !reviewerIds.includes(participant.id)) || [],
    [reviewerIds, project]
  );

  const availableReviewers = useMemo(
    () => reviewersSource.filter((participant) => !assigneeIds.includes(participant.id)),
    [assigneeIds, reviewersSource]
  );

  const reviewTypes = useMemo(() => {
    const types = Object.values(TASK_REVIEW_TYPE);
    return project?.aiReviewEnabled ? types : types.filter((type) => type !== TASK_REVIEW_TYPE.AI_ONLY);
  }, [project?.aiReviewEnabled]);

  useEffect(() => {
    if (!isManualReviewers) {
      if (reviewerIds.length > 0) {
        queueMicrotask(() => setValue('reviewerIds', [], { shouldDirty: true, shouldValidate: true }));
      }
      return;
    }

    const availableReviewerIds = new Set(availableReviewers.map((participant) => participant.id));
    const nextReviewerIds = reviewerIds.filter((id) => availableReviewerIds.has(id));

    if (nextReviewerIds.length !== reviewerIds.length) {
      queueMicrotask(() => setValue('reviewerIds', nextReviewerIds, { shouldDirty: true, shouldValidate: true }));
    }
  }, [availableReviewers, isManualReviewers, reviewerIds, setValue]);

  const submit = async (form) => {
    try {
      const result = await createTask({
        projectId: project.id,
        payload: {
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          evaluationCriteria: form.evaluationCriteria.trim(),
        },
      }).unwrap();

      if (result?.accepted && result?.taskId) {
        navigate(`${ROUTES.projects}/${project.id}/tasks/${result.taskId}`, { replace: true });
      }
    } catch {
      showSnackbar('Не удалось создать задачу. Попробуйте позже', 'error');
    }
  };

  const onInvalid = (formErrors) => {
    const firstError = formErrors.deadline || formErrors.assigneeIds || formErrors.reviewerIds || formErrors.name;

    if (firstError?.message) {
      showSnackbar(firstError.message, 'error');
    }
  };

  const getError = (fieldName) => {
    if (!(touchedFields[fieldName] || isSubmitted)) {
      return '';
    }

    return errors[fieldName]?.message || '';
  };

  const nameError = getError('name');
  const deadlineError = getError('deadline');

  if (isLoading) {
    return (
      <div className="task-create-page">
        <div className="task-create-page__loader">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="task-create-page">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={closeSnackbar} />

      <main className="task-create-page__content">
        <button
          className="task-create-page__back"
          type="button"
          onClick={() => navigate(`${ROUTES.projects}/${projectId}`)}
        >
          ← Назад
        </button>
        <h1 className="task-create-page__title">Создание задачи</h1>

        <form className="task-create-page__form" onSubmit={handleSubmit(submit, onInvalid)}>
          <div className="task-create-page__fields">
            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Название</h3>
              <input
                className={`task-create-page__input ${nameError ? 'task-create-page__input--error' : ''}`}
                type="text"
                placeholder="Название"
                maxLength={100}
                {...register('name')}
              />
              {nameError && <p className="task-create-page__error">{nameError}</p>}
            </div>

            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Описание задачи</h3>
              <textarea
                className="task-create-page__input task-create-page__textarea"
                placeholder="Описание задачи"
                maxLength={4000}
                {...register('description')}
              />
            </div>

            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Требования</h3>
              <textarea
                className="task-create-page__input task-create-page__textarea"
                placeholder="Требования"
                maxLength={4000}
                {...register('requirements')}
              />
            </div>

            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Критерии оценки</h3>
              <textarea
                className="task-create-page__input task-create-page__textarea"
                placeholder="Критерии оценки"
                maxLength={4000}
                {...register('evaluationCriteria')}
              />
            </div>
          </div>

          <div className="task-create-page__block">
            <h3 className="task-create-page__block-title">Дедлайн</h3>
            <Controller
              control={control}
              name="deadline"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  minDateTime={nowMin}
                  placeholder="Выберите дату и время"
                  hasError={Boolean(deadlineError)}
                  onBlur={field.onBlur}
                />
              )}
            />
            {deadlineError && <p className="task-create-page__error">{deadlineError}</p>}
          </div>

          <div className="task-create-page__block">
            <h3 className="task-create-page__block-title">Тип ревью</h3>
            <div className="task-create-page__radio-list">
              {reviewTypes.map((type) => (
                <label key={type} className="task-create-page__radio-item">
                  <input className="task-create-page__radio" type="radio" value={type} {...register('reviewType')} />
                  <span>{TASK_REVIEW_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>

          {isManualReviewers && (
            <div className="task-create-page__block">
              <Controller
                control={control}
                name="reviewerIds"
                render={({ field }) => (
                  <AssigneesSelector
                    title="Ревьюеры"
                    users={availableReviewers}
                    selectedUserIds={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>
          )}

          <div className="task-create-page__block">
            <Controller
              control={control}
              name="assigneeIds"
              render={({ field }) => (
                <AssigneesSelector
                  users={availableAssignees}
                  selectedUserIds={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <button className="task-create-page__submit" type="submit" disabled={!isValid || isSubmitting}>
            <CheckIcon />
          </button>
        </form>
      </main>
    </div>
  );
};

export default TaskCreatePage;

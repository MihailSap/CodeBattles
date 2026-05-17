import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useCreateTaskMutation,
  useGetOrganizationByIdQuery,
  useGetProjectByIdQuery
} from '@/entities/project';
import { AssigneesSelector } from '@/features/manage-task';
import DateTimePicker from '@/shared/ui/date-time-picker';
import { CheckIcon } from '@/shared/ui/icons';
import Snackbar from '@/shared/ui/snackbar';
import Spinner from '@/shared/ui/spinner';
import { PROJECT_PRIVACY, TASK_REVIEW_TYPE, TASK_REVIEW_TYPE_LABELS } from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useSnackbar } from '@/shared/lib/hooks';
import { validateTaskName } from '@/entities/project';
import './TaskCreatePage.css';

const initialState = {
  name: '',
  description: '',
  requirements: '',
  evaluationCriteria: '',
  deadline: '',
  reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
  assigneeIds: [],
  reviewerIds: []
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

const TaskCreatePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [touched, setTouched] = useState({ name: false, deadline: false, submitted: false });
  const { snackbar, showSnackbar, closeSnackbar } = useSnackbar();
  const {
    data: project,
    error: projectError,
    isLoading: isProjectLoading
  } = useGetProjectByIdQuery(projectId, {
    refetchOnMountOrArgChange: 30
  });
  const shouldLoadOrganization = Boolean(project?.organizationId && project.privacy === PROJECT_PRIVACY.PUBLIC);
  const {
    data: organization,
    isLoading: isOrganizationLoading
  } = useGetOrganizationByIdQuery(project?.organizationId, {
    skip: !shouldLoadOrganization,
    refetchOnMountOrArgChange: 60
  });
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
  const nameError = useMemo(() => validateTaskName(form.name), [form.name]);
  const deadlineError = useMemo(() => {
    if (!form.deadline) {
      return 'Выберите дедлайн';
    }

    if (isPastDateTime(form.deadline)) {
      return 'Дедлайн не может быть в прошлом';
    }

    return '';
  }, [form.deadline]);

  const showDeadlineError = touched.deadline || touched.submitted;
  const isValid = !nameError && !deadlineError;
  const isManualReviewers = form.reviewType === TASK_REVIEW_TYPE.MANUAL_ASSIGNEES;

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
    () => project?.participants.filter((participant) => !form.reviewerIds.includes(participant.id)) || [],
    [form.reviewerIds, project]
  );

  const availableReviewers = useMemo(
    () => reviewersSource.filter((participant) => !form.assigneeIds.includes(participant.id)),
    [form.assigneeIds, reviewersSource]
  );

  const reviewTypes = useMemo(() => {
    const types = Object.values(TASK_REVIEW_TYPE);
    return project?.aiReviewEnabled ? types : types.filter(type => type !== TASK_REVIEW_TYPE.AI_ONLY);
  }, [project?.aiReviewEnabled]);

  useEffect(() => {
    if (!isManualReviewers) {
      if (form.reviewerIds.length > 0) {
        queueMicrotask(() => setForm((prev) => ({ ...prev, reviewerIds: [] })));
      }
      return;
    }

    const availableReviewerIds = new Set(availableReviewers.map((participant) => participant.id));
    const nextReviewerIds = form.reviewerIds.filter((id) => availableReviewerIds.has(id));

    if (nextReviewerIds.length !== form.reviewerIds.length) {
      queueMicrotask(() => setForm((prev) => ({ ...prev, reviewerIds: nextReviewerIds })));
    }
  }, [availableReviewers, form.reviewerIds, isManualReviewers]);

  const submit = async (event) => {
    event.preventDefault();

    setTouched({ name: true, deadline: true, submitted: true });

    if (!form.deadline) {
      return;
    }

    if (isPastDateTime(form.deadline)) {
      showSnackbar('Дедлайн не может быть в прошлом', 'error');
      return;
    }

    if (!isValid) {
      return;
    }

    if (form.assigneeIds.length === 0) {
      showSnackbar('Выберите хотя бы одного исполнителя', 'error');
      return;
    }

    if (isManualReviewers && form.reviewerIds.length === 0) {
      showSnackbar('Выберите хотя бы одного ревьюера', 'error');
      return;
    }

    try {
      const result = await createTask({
        projectId: project.id,
        payload: {
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          evaluationCriteria: form.evaluationCriteria.trim()
        }
      }).unwrap();

      if (result?.accepted && result?.taskId) {
        navigate(`${ROUTES.projects}/${project.id}/tasks/${result.taskId}`, { replace: true });
      }
    } catch {
      showSnackbar('Не удалось создать задачу. Попробуйте позже', 'error');
    }
  };

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
        <button className="task-create-page__back" type="button" onClick={() => navigate(`${ROUTES.projects}/${projectId}`)}>
          ← Назад
        </button>
        <h1 className="task-create-page__title">Создание задачи</h1>

        <form className="task-create-page__form" onSubmit={submit}>
          <div className="task-create-page__fields">
            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Название</h3>
              <input
                className={`task-create-page__input ${touched.name && nameError ? 'task-create-page__input--error' : ''}`}
                type="text"
                placeholder="Название"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value.slice(0, 100) }))}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                maxLength={100}
              />
              {touched.name && nameError && <p className="task-create-page__error">{nameError}</p>}
            </div>

            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Описание задачи</h3>
              <textarea
                className="task-create-page__input task-create-page__textarea"
                placeholder="Описание задачи"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value.slice(0, 4000) }))}
                maxLength={4000}
              />
            </div>

            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Требования</h3>
              <textarea
                className="task-create-page__input task-create-page__textarea"
                placeholder="Требования"
                value={form.requirements}
                onChange={(event) => setForm((prev) => ({ ...prev, requirements: event.target.value.slice(0, 4000) }))}
                maxLength={4000}
              />
            </div>

            <div className="task-create-page__field">
              <h3 className="task-create-page__field-title">Критерии оценки</h3>
              <textarea
                className="task-create-page__input task-create-page__textarea"
                placeholder="Критерии оценки"
                value={form.evaluationCriteria}
                onChange={(event) => setForm((prev) => ({ ...prev, evaluationCriteria: event.target.value.slice(0, 4000) }))}
                maxLength={4000}
              />
            </div>
          </div>

          <div className="task-create-page__block">
            <h3 className="task-create-page__block-title">Дедлайн</h3>
            <DateTimePicker
              value={form.deadline}
              onChange={(deadline) => setForm((prev) => ({ ...prev, deadline }))}
              minDateTime={nowMin}
              placeholder="Выберите дату и время"
              hasError={showDeadlineError && Boolean(deadlineError)}
              onBlur={() => setTouched((prev) => ({ ...prev, deadline: true }))}
            />
            {showDeadlineError && deadlineError && <p className="task-create-page__error">{deadlineError}</p>}
          </div>

          <div className="task-create-page__block">
            <h3 className="task-create-page__block-title">Тип ревью</h3>
            <div className="task-create-page__radio-list">
              {reviewTypes.map((type) => (
                <label key={type} className="task-create-page__radio-item">
                  <input
                    className="task-create-page__radio"
                    type="radio"
                    checked={form.reviewType === type}
                    onChange={() => setForm((prev) => ({ ...prev, reviewType: type }))}
                  />
                  <span>{TASK_REVIEW_TYPE_LABELS[type]}</span>
                </label>
              ))}
            </div>
          </div>

          {isManualReviewers && (
            <div className="task-create-page__block">
              <AssigneesSelector
                title="Ревьюеры"
                users={availableReviewers}
                selectedUserIds={form.reviewerIds}
                onChange={(reviewerIds) => setForm((prev) => ({ ...prev, reviewerIds }))}
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="task-create-page__block">
            <AssigneesSelector
              users={availableAssignees}
              selectedUserIds={form.assigneeIds}
              onChange={(assigneeIds) => setForm((prev) => ({ ...prev, assigneeIds }))}
              disabled={isSubmitting}
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

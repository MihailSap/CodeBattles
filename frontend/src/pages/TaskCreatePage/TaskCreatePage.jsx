import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import AssigneesSelector from '../../components/AssigneesSelector/AssigneesSelector';
import DateTimePicker from '../../components/DateTimePicker/DateTimePicker';
import { CheckIcon } from '../../components/Icons/Icons';
import Header from '../../components/Header/Header';
import Snackbar from '../../components/Snackbar/Snackbar';
import Spinner from '../../components/Spinner/Spinner';
import { TASK_REVIEW_TYPE, TASK_REVIEW_TYPE_LABELS } from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { validateTaskName } from '../../utils/projectValidation';
import './TaskCreatePage.css';

const initialState = {
  name: '',
  description: '',
  requirements: '',
  evaluationCriteria: '',
  deadline: '',
  reviewType: TASK_REVIEW_TYPE.MANUAL_ASSIGNEES,
  assigneeIds: []
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
  const { userId } = useAuth();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [form, setForm] = useState(initialState);
  const [touched, setTouched] = useState({ name: false, deadline: false, submitted: false });
  const [snackbar, setSnackbar] = useState({ message: '', type: 'success' });

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      setIsLoading(true);

      try {
        const result = await projectsApi.getProjectById(projectId, Number(userId));

        if (!isMounted) {
          return;
        }

        if (result.viewerRole !== 'OWNER') {
          navigate(`${ROUTES.projects}/${projectId}`, { replace: true });
          return;
        }

        setProject(result);
      } catch {
        if (isMounted) {
          navigate(ROUTES.projects, { replace: true });
        }
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

  const submit = async (event) => {
    event.preventDefault();

    setTouched({ name: true, deadline: true, submitted: true });

    if (!form.deadline) {
      return;
    }

    if (isPastDateTime(form.deadline)) {
      setSnackbar({ message: 'Дедлайн не может быть в прошлом', type: 'error' });
      return;
    }

    if (!isValid) {
      return;
    }

    if (form.assigneeIds.length === 0) {
      setSnackbar({ message: 'Выберите хотя бы одного исполнителя', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await projectsApi.createTask(project.id, {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        evaluationCriteria: form.evaluationCriteria.trim()
      });

      if (result?.accepted && result?.taskId) {
        navigate(`${ROUTES.projects}/${project.id}/tasks/${result.taskId}`, { replace: true });
      }
    } catch {
      setSnackbar({ message: 'Не удалось создать задачу. Попробуйте позже', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="task-create-page">
        <Header />
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
      <Header />
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={() => setSnackbar({ message: '', type: 'success' })} />

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
              {Object.values(TASK_REVIEW_TYPE).map((type) => (
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

          <div className="task-create-page__block">
            <AssigneesSelector
              users={project.participants}
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

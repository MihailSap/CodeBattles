import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGetDashboardProjectsQuery,
  useGetDashboardReviewsQuery,
  useGetDashboardTasksQuery,
} from '@/entities/dashboard';
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  getDeadlineToneClass,
  type DeadlineTone,
  type TaskStatus,
} from '@/entities/project';
import { REVIEW_STATUS, type ReviewStatus } from '@/entities/review';
import EntityTabs from '@/shared/ui/entity-tabs';
import ReviewDropdown from '@/shared/ui/review-dropdown';
import { ROUTES } from '@/shared/config/routes';
import mainPageStyles from './MainPage.module.scss';

type DashboardMode = 'all' | 'tasks' | 'reviews';
type StatusFilter = 'all' | 'active' | 'overdue';

interface DashboardTaskItem {
  id: number;
  projectId: number;
  taskName: string;
  projectName: string;
  deadline: string | null;
  status: TaskStatus;
  isOverdue: boolean;
}

interface DashboardReviewItem {
  reviewId: number;
  taskName: string;
  taskId: number;
  projectId: number;
  projectName: string;
  uploadedAt: string;
  deadline: string;
  status: ReviewStatus;
  isOverdue: boolean;
  remainingMs: number;
}

interface DashboardProjectOption {
  id: number;
  name: string;
}

const dashboardTabs = [
  { key: 'all', label: 'Все' },
  { key: 'tasks', label: 'Мои задачи' },
  { key: 'reviews', label: 'Мои ревью' },
] satisfies Array<{ key: DashboardMode; label: string }>;

const statusOptions = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'overdue', label: 'Просроченные' },
] satisfies Array<{ value: StatusFilter; label: string }>;

const PROJECT_OPTION_MAX_LENGTH = 28;
const TASK_NAME_MAX_LENGTH = 40;
const PROJECT_NAME_MAX_LENGTH = 40;

const truncateProjectOptionLabel = (value: string) => {
  if (value.length <= PROJECT_OPTION_MAX_LENGTH) {
    return value;
  }

  return `${value.slice(0, PROJECT_OPTION_MAX_LENGTH - 1)}…`;
};

const truncateWithEllipsis = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('ru-RU');
};

const formatRemainingTime = (milliseconds: number) => {
  const positiveMs = Math.max(0, milliseconds);
  const totalMinutes = Math.floor(positiveMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return `${days} дн ${hours} ч ${minutes} мин`;
};

const DEADLINE_TONE_CLASS = {
  '': '',
  success: mainPageStyles.isSuccess,
  warning: mainPageStyles.isWarning,
  error: mainPageStyles.isError,
} satisfies Record<DeadlineTone, string>;

const parseTimestamp = (value: unknown) => {
  if (!value || typeof value !== 'string') {
    return Number.NaN;
  }

  return new Date(value).getTime();
};

const toNumberOrFallback = (value: unknown, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
};

const MainPage = () => {
  const navigate = useNavigate();
  const [nowTimestamp] = useState<number>(() => Date.now());
  const [mode, setMode] = useState<DashboardMode>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const { data: dashboardTasks = [] } = useGetDashboardTasksQuery(undefined);
  const { data: dashboardReviews = [] } = useGetDashboardReviewsQuery(undefined);
  const { data: dashboardProjects = [] } = useGetDashboardProjectsQuery(undefined);

  const normalizedProjects = useMemo<DashboardProjectOption[]>(() => {
    return dashboardProjects
      .map((project, index) => {
        const id = toNumberOrFallback(project.id, index + 1);
        const name = typeof project.name === 'string' && project.name.trim() ? project.name : `Проект #${id}`;

        return { id, name };
      })
      .sort((left: DashboardProjectOption, right: DashboardProjectOption) => left.name.localeCompare(right.name, 'ru'));
  }, [dashboardProjects]);

  const projectsMap = useMemo(() => {
    return new Map(normalizedProjects.map((project) => [project.id, project.name]));
  }, [normalizedProjects]);

  const projectOptions = useMemo(
    () => [
      {
        value: 'all',
        label: 'Все',
      },
      ...normalizedProjects.map((project) => ({
        value: String(project.id),
        label: truncateProjectOptionLabel(project.name),
      })),
    ],
    [normalizedProjects]
  );

  const allTasks = useMemo<DashboardTaskItem[]>(() => {
    return dashboardTasks
      .filter((task) => task.status !== TASK_STATUS.DONE)
      .map((task) => {
        const taskId = toNumberOrFallback(task.id, 0);
        const projectId = toNumberOrFallback(task.projectId, 0);
        const deadlineDate = task.deadline ? new Date(String(task.deadline)) : null;

        const isOverdue = Boolean(
          deadlineDate && !Number.isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < nowTimestamp
        );

        return {
          id: taskId,
          projectId,
          taskName: typeof task.taskName === 'string' && task.taskName.trim() ? task.taskName : '—',
          projectName:
            (typeof task.projectName === 'string' && task.projectName) ||
            projectsMap.get(projectId) ||
            `Проект #${projectId}`,
          deadline: typeof task.deadline === 'string' ? task.deadline : null,
          status: task.status,
          isOverdue,
        };
      })
      .sort((left: DashboardTaskItem, right: DashboardTaskItem) => {
        const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : Number.POSITIVE_INFINITY;
        const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : Number.POSITIVE_INFINITY;

        if (leftDeadline !== rightDeadline) {
          return leftDeadline - rightDeadline;
        }

        return left.taskName.localeCompare(right.taskName, 'ru');
      });
  }, [dashboardTasks, nowTimestamp, projectsMap]);

  const allReviews = useMemo<DashboardReviewItem[]>(() => {
    return dashboardReviews
      .filter((review) => review.status === REVIEW_STATUS.NEW || review.status === REVIEW_STATUS.IN_PROGRESS)
      .map((review) => {
        const reviewId = toNumberOrFallback(review.id ?? review.reviewId, 0);
        const taskId = toNumberOrFallback(review.taskId, 0);
        const projectId = toNumberOrFallback(review.project?.id ?? review.projectId, 0);

        const deadlineRaw =
          typeof review.responseDeadline === 'string'
            ? review.responseDeadline
            : typeof review.deadline === 'string'
              ? review.deadline
              : null;

        const deadlineMs = deadlineRaw ? parseTimestamp(deadlineRaw) : Number.NaN;
        const remainingMs = deadlineMs - nowTimestamp;

        return {
          reviewId,
          taskName: typeof review.taskName === 'string' && review.taskName.trim() ? review.taskName : '—',
          taskId,
          projectId,
          projectName:
            (typeof review.project?.name === 'string' && review.project.name) ||
            (typeof review.projectName === 'string' && review.projectName) ||
            projectsMap.get(projectId) ||
            `Проект #${projectId}`,
          uploadedAt: typeof review.uploadedAt === 'string' ? review.uploadedAt : '',
          deadline: deadlineRaw || '',
          status: review.status,
          isOverdue: Number.isFinite(remainingMs) && remainingMs < 0,
          remainingMs: Number.isFinite(remainingMs) ? remainingMs : Number.POSITIVE_INFINITY,
        };
      })
      .sort((left: DashboardReviewItem, right: DashboardReviewItem) => left.remainingMs - right.remainingMs);
  }, [dashboardReviews, nowTimestamp, projectsMap]);

  const visibleTasks = useMemo(
    () =>
      allTasks.filter((task) => {
        const isProjectMatched = projectFilter === 'all' || projectFilter === String(task.projectId);

        const isStatusMatched =
          statusFilter === 'all' ||
          (statusFilter === 'active' && !task.isOverdue) ||
          (statusFilter === 'overdue' && task.isOverdue);

        return isProjectMatched && isStatusMatched;
      }),
    [allTasks, projectFilter, statusFilter]
  );

  const visibleReviews = useMemo(
    () =>
      allReviews.filter((review) => {
        const isProjectMatched = projectFilter === 'all' || projectFilter === String(review.projectId);

        const isStatusMatched =
          statusFilter === 'all' ||
          (statusFilter === 'active' && !review.isOverdue) ||
          (statusFilter === 'overdue' && review.isOverdue);

        return isProjectMatched && isStatusMatched;
      }),
    [allReviews, projectFilter, statusFilter]
  );

  return (
    <div className={mainPageStyles.root}>
      <div className={mainPageStyles.content}>
        <h1 className={mainPageStyles.pageTitle}>Активные задачи и ревью</h1>

        <section className={mainPageStyles.sectionCard}>
          <EntityTabs
            tabs={dashboardTabs}
            activeKey={mode}
            onChange={(nextMode) => {
              if (nextMode === 'all' || nextMode === 'tasks' || nextMode === 'reviews') {
                setMode(nextMode);
              }
            }}
            wrapClassName={mainPageStyles.tabsWrap}
            tabClassName={mainPageStyles.tabsTab}
          />

          <div className={mainPageStyles.filters}>
            <ReviewDropdown
              label="Статус"
              value={statusFilter}
              options={statusOptions}
              onChange={(value) => {
                if (value === 'all' || value === 'active' || value === 'overdue') {
                  setStatusFilter(value);
                }
              }}
              triggerClassName={mainPageStyles.dropdownTrigger}
              menuClassName={mainPageStyles.dropdownMenu}
            />
            <ReviewDropdown
              label="Проект"
              value={projectFilter}
              options={projectOptions}
              onChange={setProjectFilter}
              triggerClassName={mainPageStyles.dropdownTrigger}
              menuClassName={mainPageStyles.dropdownMenu}
            />
          </div>

          {(mode === 'all' || mode === 'tasks') && (
            <div className={mainPageStyles.block}>
              <h2 className={mainPageStyles.blockTitle}>Мои задачи</h2>

              {visibleTasks.length === 0 ? (
                <p className={mainPageStyles.emptyText}>У вас нет активных задач</p>
              ) : (
                <div className={mainPageStyles.tableWrap}>
                  <table className={mainPageStyles.table}>
                    <thead>
                      <tr>
                        <th>Задача</th>
                        <th>Проект</th>
                        <th>Дедлайн</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleTasks.map((task) => (
                        <tr
                          key={task.id}
                          className={[mainPageStyles.clickableRow, task.isOverdue ? mainPageStyles.isOverdueRow : '']
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() =>
                            navigate(
                              ROUTES.projectTaskById
                                .replace(':projectId', String(task.projectId))
                                .replace(':taskId', String(task.id))
                            )
                          }
                        >
                          <td>
                            <Link
                              className={mainPageStyles.primaryLink}
                              to={ROUTES.projectTaskById
                                .replace(':projectId', String(task.projectId))
                                .replace(':taskId', String(task.id))}
                              title={task.taskName}
                            >
                              {truncateWithEllipsis(task.taskName, TASK_NAME_MAX_LENGTH)}
                            </Link>
                          </td>
                          <td>
                            <Link
                              className={mainPageStyles.primaryLink}
                              to={ROUTES.projectById.replace(':projectId', String(task.projectId))}
                              title={task.projectName}
                            >
                              {truncateWithEllipsis(task.projectName, PROJECT_NAME_MAX_LENGTH)}
                            </Link>
                          </td>
                          <td
                            className={[
                              mainPageStyles.deadline,
                              DEADLINE_TONE_CLASS[getDeadlineToneClass(task.deadline, task.status)],
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {formatDate(task.deadline)}
                          </td>
                          <td>{TASK_STATUS_LABELS[task.status]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {(mode === 'all' || mode === 'reviews') && (
            <div className={mainPageStyles.block}>
              <h2 className={mainPageStyles.blockTitle}>Мои ревью</h2>

              {visibleReviews.length === 0 ? (
                <p className={mainPageStyles.emptyText}>Нет решений, ожидающих вашего ревью</p>
              ) : (
                <div className={mainPageStyles.tableWrap}>
                  <table className={mainPageStyles.table}>
                    <thead>
                      <tr>
                        <th>Задача</th>
                        <th>Проект</th>
                        <th>Дата загрузки</th>
                        <th>Осталось времени</th>
                        <th>Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleReviews.map((review) => (
                        <tr
                          key={review.reviewId}
                          className={[mainPageStyles.clickableRow, review.isOverdue ? mainPageStyles.isOverdueRow : '']
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => navigate(ROUTES.reviewById.replace(':reviewId', String(review.reviewId)))}
                        >
                          <td>
                            <Link
                              className={mainPageStyles.primaryLink}
                              to={ROUTES.reviewById.replace(':reviewId', String(review.reviewId))}
                              title={review.taskName}
                            >
                              {truncateWithEllipsis(review.taskName, TASK_NAME_MAX_LENGTH)}
                            </Link>
                          </td>
                          <td>
                            <Link
                              className={mainPageStyles.primaryLink}
                              to={ROUTES.projectById.replace(':projectId', String(review.projectId))}
                              title={review.projectName}
                            >
                              {truncateWithEllipsis(review.projectName, PROJECT_NAME_MAX_LENGTH)}
                            </Link>
                          </td>
                          <td>{formatDate(review.uploadedAt)}</td>
                          <td>{formatRemainingTime(review.remainingMs)}</td>
                          <td>{review.status === 'NEW' ? 'Новое' : 'В работе'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MainPage;

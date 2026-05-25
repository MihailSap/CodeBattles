import { PROJECT_MEMBER_ROLE, TASK_STATUS, TASK_STATUS_ORDER } from '../model';
import type { ProjectParticipant, Task } from '../model/types';
import type { TaskStatus } from '../model';

const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

const fullDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const compareText = (left: string | null | undefined, right: string | null | undefined): number =>
  (left ?? '').localeCompare(right ?? '', 'ru', {
    sensitivity: 'base',
  });

export const formatDeadline = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return dateTimeFormatter.format(date).replace(',', '');
};

export const formatLastActivity = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfActivityDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfActivityDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    return timeFormatter.format(date);
  }

  if (dayDiff === 1) {
    return 'вчера';
  }

  if (dayDiff === 2) {
    return 'позавчера';
  }

  if (date.getFullYear() === now.getFullYear()) {
    return monthFormatter.format(date);
  }

  return fullDateFormatter.format(date);
};

export type DeadlineTone = '' | 'success' | 'error' | 'warning';

export const getDeadlineToneClass = (deadline: string | null | undefined, status: TaskStatus): DeadlineTone => {
  if (!deadline) {
    return '';
  }

  if (status === TASK_STATUS.DONE) {
    return 'success';
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);

  if (Number.isNaN(deadlineDate.getTime())) {
    return '';
  }

  const nowMs = now.getTime();
  const deadlineMs = deadlineDate.getTime();

  if (deadlineMs < nowMs) {
    return 'error';
  }

  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  if (deadlineMs - nowMs <= threeDaysMs) {
    return 'warning';
  }

  return 'success';
};

export const sortTasks = (tasks: readonly Task[] = []): Task[] => {
  return [...tasks].sort((left, right) => {
    const leftStatusOrder = TASK_STATUS_ORDER.indexOf(left.status);
    const rightStatusOrder = TASK_STATUS_ORDER.indexOf(right.status);

    if (leftStatusOrder !== rightStatusOrder) {
      return leftStatusOrder - rightStatusOrder;
    }

    const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftDeadline !== rightDeadline) {
      return leftDeadline - rightDeadline;
    }

    return compareText(left.name, right.name);
  });
};

const getRoleOrder = (role: ProjectParticipant['role']): number => {
  if (role === PROJECT_MEMBER_ROLE.OWNER) return 0;
  if (role === PROJECT_MEMBER_ROLE.MEMBER) return 1;

  return 10;
};

export const sortParticipants = (participants: readonly ProjectParticipant[] = []): ProjectParticipant[] => {
  return [...participants].sort((left, right) => {
    const roleDelta = getRoleOrder(left.role) - getRoleOrder(right.role);

    if (roleDelta !== 0) {
      return roleDelta;
    }

    return compareText(left.fullName, right.fullName);
  });
};

export const truncateText = (value: string | null | undefined, maxLength: number): string | null | undefined => {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
};

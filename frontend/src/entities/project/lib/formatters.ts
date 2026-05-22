import { PROJECT_MEMBER_ROLE, TASK_STATUS, TASK_STATUS_ORDER } from '../model';

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

const compareText = (left: LegacyValue, right: LegacyValue) =>
  String(left ?? '').localeCompare(String(right ?? ''), 'ru', {
    sensitivity: 'base',
  });

export const formatDeadline = (value: LegacyValue) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return dateTimeFormatter.format(date).replace(',', '');
};

export const formatLastActivity = (value: LegacyValue) => {
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

export const getDeadlineToneClass = (deadline: LegacyValue, status: LegacyValue) => {
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

export const sortTasks = (tasks: LegacyValue = []) => {
  return [...tasks].sort((left: LegacyValue, right: LegacyValue) => {
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

const roleOrder = {
  [PROJECT_MEMBER_ROLE.OWNER]: 0,
  [PROJECT_MEMBER_ROLE.MEMBER]: 1,
};

export const sortParticipants = (participants: LegacyValue = []) => {
  return [...participants].sort((left: LegacyValue, right: LegacyValue) => {
    const roleDelta = (roleOrder[left.role] ?? 10) - (roleOrder[right.role] ?? 10);

    if (roleDelta !== 0) {
      return roleDelta;
    }

    return compareText(left.fullName, right.fullName);
  });
};

export const truncateText = (value: LegacyValue, maxLength: LegacyValue) => {
  if (!value || value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
};

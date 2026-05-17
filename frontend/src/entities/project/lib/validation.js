const URL_PATTERN = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

export const validateProjectName = (value) => {
  const normalized = value.trim();

  if (!normalized) {
    return 'Название проекта не может быть пустым';
  }

  if (normalized.length > 100) {
    return 'Название проекта должно быть не длиннее 100 символов';
  }

  return '';
};

export const validateTaskName = (value) => {
  const normalized = value.trim();

  if (!normalized) {
    return 'Название задачи не может быть пустым';
  }

  if (normalized.length > 100) {
    return 'Название задачи должно быть короче 100 символов';
  }

  return '';
};

export const validateRepositoryUrl = (value) => {
  const normalized = value.trim();

  if (!normalized) {
    return '';
  }

  if (!URL_PATTERN.test(normalized)) {
    return 'Введите корректную ссылку';
  }

  return '';
};

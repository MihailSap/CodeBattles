const URL_PATTERN = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

export const validateOrganizationName = (value) => {
  const normalized = value.trim();

  if (!normalized) {
    return 'Название организации не может быть пустым';
  }

  if (normalized.length > 100) {
    return 'Название организации должно быть короче 100 символов';
  }

  return '';
};

export const validateOrganizationUrl = (value) => {
  const normalized = value.trim();

  if (!normalized) {
    return '';
  }

  if (!URL_PATTERN.test(normalized)) {
    return 'Введите корректную ссылку';
  }

  return '';
};

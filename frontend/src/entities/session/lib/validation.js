const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value) => {
  if (!value.trim()) {
    return "E-mail не может быть пустым";
  }

  if (!EMAIL_PATTERN.test(value.trim())) {
    return "Некорректный E-mail";
  }

  return "";
};

export const validatePassword = (value) => {
  if (value.length < 8) {
    return "Минимальная длина пароля - 8 символов";
  }

  return "";
};

export const validateConfirmPassword = (value, currentPassword) => {
  if (value && value !== currentPassword) {
    return "Пароли не совпадают";
  }

  return "";
};

export const validateLogin = (value) => {
  if (!value.trim()) {
    return "Логин не может быть пустым";
  }

  if (value.trim().length < 3 || value.trim().length > 50) {
    return "Логин - от 3 до 50 символов";
  }

  return "";
};
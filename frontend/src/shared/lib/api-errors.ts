const NETWORK_ERROR_MESSAGE = 'Не удалось подключиться к серверу. Проверьте интернет и попробуйте снова.';
const TIMEOUT_ERROR_MESSAGE = 'Сервер отвечает слишком долго. Попробуйте снова.';

const COMMON_STATUS_MESSAGES = {
  400: 'Проверьте корректность введенных данных.',
  401: 'Сессия истекла. Выполните вход снова.',
  403: 'Доступ запрещен.',
  404: 'Запрашиваемый ресурс не найден.',
  409: 'Конфликт данных. Проверьте введенные значения.',
  422: 'Некорректные данные. Проверьте заполнение полей.',
  429: 'Слишком много запросов. Попробуйте позже.',
  500: 'Внутренняя ошибка сервера. Попробуйте позже.',
  502: 'Сервер временно недоступен. Попробуйте позже.',
  503: 'Сервис временно недоступен. Попробуйте позже.',
  504: 'Сервер не ответил вовремя. Попробуйте позже.',
};

const CONTEXT_STATUS_MESSAGES = {
  currentUser: {
    401: 'Сессия недействительна, войдите снова.',
    403: 'Сессия недействительна, войдите снова.',
  },
  login: {
    400: 'Неверный E-mail или пароль.',
    401: 'Неверный E-mail или пароль.',
    403: 'Неверный E-mail или пароль.',
  },
  register: {
    400: 'Не удалось зарегистрироваться. Проверьте введенные данные.',
    409: 'Пользователь с таким E-mail или логином уже существует.',
    422: 'Не удалось зарегистрироваться. Проверьте введенные данные.',
  },
  verifyEmail: {
    400: 'Ссылка подтверждения недействительна или устарела.',
    401: 'Ссылка подтверждения недействительна или устарела.',
    403: 'Ссылка подтверждения недействительна или устарела.',
    404: 'Ссылка подтверждения недействительна или устарела.',
  },
  forgotPassword: {
    400: 'Не удалось отправить ссылку. Проверьте корректность E-mail.',
    404: 'Аккаунт с таким E-mail не найден.',
    422: 'Не удалось отправить ссылку. Проверьте корректность E-mail.',
  },
  resetPassword: {
    400: 'Не удалось изменить пароль. Попробуйте снова.',
    401: 'Ссылка для сброса пароля недействительна или устарела.',
    403: 'Ссылка для сброса пароля недействительна или устарела.',
    404: 'Ссылка для сброса пароля недействительна или устарела.',
    422: 'Не удалось изменить пароль. Проверьте корректность нового пароля.',
  },
  updateLogin: {
    400: 'Не удалось обновить логин. Проверьте введенные данные.',
    409: 'Такой логин уже занят.',
    422: 'Не удалось обновить логин. Проверьте введенные данные.',
  },
  updatePassword: {
    400: 'Не удалось обновить пароль. Проверьте введенные данные.',
    422: 'Не удалось обновить пароль. Проверьте введенные данные.',
  },
};

type StatusMessageMap = Record<number, string>;
type ErrorContext = keyof typeof CONTEXT_STATUS_MESSAGES;

const isErrorContext = (context: string): context is ErrorContext =>
  Object.keys(CONTEXT_STATUS_MESSAGES).some((knownContext) => knownContext === context);

interface ApiErrorLike {
  code?: string;
  response?: {
    status?: number;
  };
}

const toApiErrorLike = (value: unknown): ApiErrorLike => {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const record = Object.entries(value);
  const code = record.find(([key]) => key === 'code')?.[1];
  const rawResponse = record.find(([key]) => key === 'response')?.[1];

  const responseStatus =
    typeof rawResponse === 'object' && rawResponse !== null
      ? Object.entries(rawResponse).find(([key]) => key === 'status')?.[1]
      : undefined;

  return {
    ...(typeof code === 'string' ? { code } : {}),
    ...(typeof responseStatus === 'number' ? { response: { status: responseStatus } } : {}),
  };
};

export const getApiErrorMessage = (error: unknown, fallback: string, context: string): string => {
  const errorLike = toApiErrorLike(error);

  if (errorLike.code === 'ECONNABORTED') {
    return TIMEOUT_ERROR_MESSAGE;
  }

  if (!errorLike.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const status = errorLike.response.status;

  const contextStatusMap: Partial<StatusMessageMap> | undefined = isErrorContext(context)
    ? CONTEXT_STATUS_MESSAGES[context]
    : undefined;

  const contextMessage = status ? contextStatusMap?.[status] : undefined;

  if (contextMessage) {
    return contextMessage;
  }

  const commonStatusMap: Partial<StatusMessageMap> = COMMON_STATUS_MESSAGES;

  if (status && commonStatusMap[status]) {
    return commonStatusMap[status];
  }

  return fallback;
};

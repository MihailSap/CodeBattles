import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/app/providers/store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/shared/lib/theme';
import GitHubIconLight from '@/shared/assets/GitHub-icon-light.svg';
import GitHubIconDark from '@/shared/assets/GitHub-icon-dark.svg';
import GitLabIcon from '@/shared/assets/GitLab-icon.svg';
import logoLight from '@/shared/assets/logo-light.svg';
import logoDark from '@/shared/assets/logo-dark.svg';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { API_BASE_URL } from '@/shared/config/api';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { clearAuthMessages, fetchCurrentUser, loginUser, registerUser } from '@/entities/session';
import { loginFormSchema, registerFormSchema } from '@/entities/session';
import { tokenStorage } from '@/shared/lib';
import authPageStyles from './AuthPage.module.scss';

const initialForm = {
  login: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const AuthPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const isLoginMode = location.pathname === ROUTES.login;
  const activeSchema = useMemo(() => (isLoginMode ? loginFormSchema : registerFormSchema), [isLoginMode]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: initialForm,
    mode: 'onChange',
  });

  const postLoginRedirect = location.state?.from || ROUTES.dashboard;

  const resetFormState = () => {
    reset(initialForm);
    setRegistrationCompleted(false);
  };

  useEffect(() => {
    reset(initialForm);
  }, [isLoginMode, reset]);

  useEffect(() => {
    dispatch(clearAuthMessages());

    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (!registrationCompleted) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      navigate(ROUTES.login, {
        replace: true,
      });
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigate, registrationCompleted]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken')?.trim();
    const refreshToken = params.get('refreshToken')?.trim();

    if (!accessToken || !refreshToken) {
      return;
    }

    let isActive = true;

    const finalizeOAuth = async () => {
      tokenStorage.setTokens({
        accessToken,
        refreshToken,
      });

      try {
        await dispatch(fetchCurrentUser()).unwrap();

        if (!isActive) {
          return;
        }

        navigate(ROUTES.dashboard, {
          replace: true,
        });
      } catch {
        tokenStorage.clearTokens();

        if (!isActive) {
          return;
        }

        navigate(ROUTES.login, {
          replace: true,
        });
      }
    };

    finalizeOAuth();

    return () => {
      isActive = false;
    };
  }, [dispatch, location.search, navigate]);

  const changeMode = (mode: LegacyValue) => {
    const nextRoute = mode === 'login' ? ROUTES.login : ROUTES.register;

    if (location.pathname !== nextRoute) {
      resetFormState();
      navigate(nextRoute);
    }
  };

  const handleGitHubAuth = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/github`;
  };

  const sanitizeValue = (name: LegacyValue, value: LegacyValue) => {
    if (name === 'login' || name === 'email') {
      return value.replace(/\s+/g, '');
    }

    return value;
  };

  const registerField = (name: LegacyValue) => {
    const field = register(name);

    return {
      ...field,
      onChange: (event: LegacyValue) => {
        event.target.value = sanitizeValue(name, event.target.value);
        field.onChange(event);
        dispatch(clearAuthMessages());
      },
    };
  };

  const onSubmit = async (form: LegacyValue) => {
    dispatch(clearAuthMessages());

    if (isLoginMode) {
      const result = await dispatch(
        loginUser({
          email: form.email.trim(),
          password: form.password,
        })
      );

      if (loginUser.fulfilled.match(result)) {
        navigate(postLoginRedirect, {
          replace: true,
        });
      }
    } else {
      const result = await dispatch(
        registerUser({
          login: form.login.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      );

      if (registerUser.fulfilled.match(result)) {
        setRegistrationCompleted(true);
      }
    }
  };

  const getFieldError = (name: LegacyValue) => {
    if (!((touchedFields as LegacyValue)[name] || isSubmitted)) {
      return '';
    }

    return String((errors as LegacyValue)[name]?.message || '');
  };

  const isSubmitDisabled = isLoading || !isValid;

  return (
    <div className={authPageStyles.root}>
      <div className={authPageStyles.bg} role="presentation" aria-hidden="true" />

      <header className={authPageStyles.authHeader}>
        <Link className={authPageStyles.logoLink} to={ROUTES.home}>
          <img className={authPageStyles.logo} src={isDark ? logoDark : logoLight} alt="CodeBattles" />
        </Link>
        <div className={authPageStyles.toggle}>
          <ThemeToggle />
        </div>
        <div className={authPageStyles.spacer} />
      </header>

      <div className={authPageStyles.authContent}>
        <section className={authPageStyles.left} />

        <section className={authPageStyles.right}>
          <div className={authPageStyles.wrap}>
            <div className={authPageStyles.card}>
              {registrationCompleted ? (
                <p className={authPageStyles.registerSuccess}>
                  Для завершения регистрации необходимо перейти по ссылке из письма, которое было отправлено на
                  указанный E-Mail.
                </p>
              ) : (
                <>
                  <div className={authPageStyles.authModeSwitch}>
                    <span
                      className={[authPageStyles.thumb, isLoginMode ? authPageStyles.isLogin : '']
                        .filter(Boolean)
                        .join(' ')}
                    />
                    <button
                      className={[authPageStyles.option, !isLoginMode ? authPageStyles.isActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      onClick={() => changeMode('register')}
                    >
                      Регистрация
                    </button>
                    <button
                      className={[authPageStyles.option, isLoginMode ? authPageStyles.isActive : '']
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      onClick={() => changeMode('login')}
                    >
                      Вход
                    </button>
                  </div>

                  <form className={authPageStyles.authForm} onSubmit={handleSubmit(onSubmit)}>
                    <div className={authPageStyles.inputs}>
                      {!isLoginMode && (
                        <div className={authPageStyles.group}>
                          <input
                            className={[authPageStyles.authInput, getFieldError('login') ? authPageStyles.isError : '']
                              .filter(Boolean)
                              .join(' ')}
                            type="text"
                            placeholder="Придумайте логин"
                            maxLength={50}
                            autoComplete="username"
                            {...registerField('login')}
                          />
                          {getFieldError('login') && <p className={authPageStyles.isError}>{getFieldError('login')}</p>}
                        </div>
                      )}

                      <div className={authPageStyles.group}>
                        <input
                          className={[authPageStyles.authInput, getFieldError('email') ? authPageStyles.isError : '']
                            .filter(Boolean)
                            .join(' ')}
                          type="text"
                          inputMode="email"
                          placeholder="Введите Ваш email"
                          maxLength={255}
                          autoComplete="email"
                          {...registerField('email')}
                        />
                        {getFieldError('email') && <p className={authPageStyles.isError}>{getFieldError('email')}</p>}
                      </div>

                      <div className={authPageStyles.group}>
                        <input
                          className={[authPageStyles.authInput, getFieldError('password') ? authPageStyles.isError : '']
                            .filter(Boolean)
                            .join(' ')}
                          type="password"
                          placeholder={isLoginMode ? 'Введите пароль' : 'Придумайте пароль'}
                          maxLength={50}
                          autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                          {...registerField('password')}
                        />
                        {getFieldError('password') && (
                          <p className={authPageStyles.isError}>{getFieldError('password')}</p>
                        )}
                      </div>

                      {!isLoginMode && (
                        <div className={authPageStyles.group}>
                          <input
                            className={[
                              authPageStyles.authInput,
                              getFieldError('confirmPassword') ? authPageStyles.isError : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            type="password"
                            placeholder="Повторите пароль"
                            maxLength={50}
                            autoComplete="new-password"
                            {...registerField('confirmPassword')}
                          />
                          {getFieldError('confirmPassword') && (
                            <p className={authPageStyles.isError}>{getFieldError('confirmPassword')}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={authPageStyles.authSocial}>
                      <button
                        className={[authPageStyles.button, authPageStyles.isGithub].join(' ')}
                        type="button"
                        onClick={handleGitHubAuth}
                      >
                        <span>Продолжить с GitHub</span>
                        <img src={isDark ? GitHubIconDark : GitHubIconLight} alt="GitHub" />
                      </button>
                      <button className={[authPageStyles.button, authPageStyles.isGitlab].join(' ')} type="button">
                        <span>Продолжить с GitLab</span>
                        <img src={GitLabIcon} alt="GitLab" />
                      </button>
                    </div>

                    {isLoginMode && (
                      <p className={authPageStyles.text}>
                        Забыли пароль?{' '}
                        <Link className={authPageStyles.link} to={ROUTES.recovery}>
                          Восстановить
                        </Link>
                      </p>
                    )}

                    <button className={authPageStyles.submit} type="submit" disabled={isSubmitDisabled}>
                      {!isLoading && (isLoginMode ? 'Войти' : 'Зарегистрироваться')}
                      {isLoading && (isLoginMode ? 'Вход...' : 'Регистрация...')}
                    </button>
                  </form>
                </>
              )}
            </div>

            {error && <div className={authPageStyles.serverError}>{error}</div>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;

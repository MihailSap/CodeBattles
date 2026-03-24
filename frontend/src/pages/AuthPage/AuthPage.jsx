import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/ThemeProvider';
import GitHubIconLight from '../../assets/GitHub-icon-light.svg';
import GitHubIconDark from '../../assets/GitHub-icon-dark.svg';
import GitLabIcon from '../../assets/GitLab-icon.svg';
import logoLight from '../../assets/logo-light.svg';
import logoDark from '../../assets/logo-dark.svg';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { API_BASE_URL } from '../../constants/api';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { clearAuthMessages, fetchCurrentUser, loginUser, registerUser } from '../../store/slices/authSlice';
import { validateLogin, validateEmail, validatePassword, validateConfirmPassword } from '../../utils/auth';
import { tokenStorage } from '../../utils/tokenStorage';
import './AuthPage.css';

const initialForm = {
  login: '',
  email: '',
  password: '',
  confirmPassword: ''
};

const initialErrors = {
  login: '',
  email: '',
  password: '',
  confirmPassword: ''
};

const AuthPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState(initialErrors);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const isLoginMode = location.pathname === ROUTES.login;

  useEffect(() => {
    dispatch(clearAuthMessages());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(initialForm);
    setValidationErrors(initialErrors);
    setTouched({});
    setSubmitted(false);
    setRegistrationCompleted(false);

    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (!registrationCompleted) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      navigate(ROUTES.login, { replace: true });
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
      tokenStorage.setTokens({ accessToken, refreshToken });

      try {
        await dispatch(fetchCurrentUser()).unwrap();

        if (!isActive) {
          return;
        }

        navigate(ROUTES.home, { replace: true });
      } catch {
        tokenStorage.clearTokens();

        if (!isActive) {
          return;
        }

        navigate(ROUTES.login, { replace: true });
      }
    };

    finalizeOAuth();

    return () => {
      isActive = false;
    };
  }, [dispatch, location.search, navigate]);

  const changeMode = (mode) => {
    const nextRoute = mode === 'login' ? ROUTES.login : ROUTES.register;

    if (location.pathname !== nextRoute) {
      navigate(nextRoute);
    }
  };

  const handleGitHubAuth = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/github`;
  };

  const sanitizeValue = (name, value) => {
    if (name === 'login' || name === 'email') {
      return value.replace(/\s+/g, '');
    }

    return value;
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        setValidationErrors((prev) => ({ ...prev, email: validateEmail(value) }));
        break;
      case 'login':
        setValidationErrors((prev) => ({ ...prev, login: validateLogin(value) }));
        break;
      case 'password':
        setValidationErrors((prev) => ({ ...prev, password: validatePassword(value) }));
        if (form.confirmPassword) {
          setValidationErrors((prev) => ({
            ...prev,
            confirmPassword: validateConfirmPassword(form.confirmPassword, value)
          }));
        }
        break;
      case 'confirmPassword':
        setValidationErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(value, form.password) }));
        break;
      default:
        break;
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = sanitizeValue(name, value);
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    dispatch(clearAuthMessages());

    if (isLoginMode) {
      return;
    }

    validateField(name, nextValue);
  };

  const isFormValid = Boolean(
    form.email.trim() &&
    (form.login.trim() || isLoginMode) &&
    form.password.trim() &&
    (form.confirmPassword.trim() || isLoginMode) &&
    !validationErrors.email &&
    !validationErrors.login &&
    !validationErrors.password &&
    !validationErrors.confirmPassword
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitted(true);

    if (!isFormValid) {
      return;
    }

    const payload = isLoginMode
      ? {
        email: form.email.trim(),
        password: form.password
      }
      : {
        login: form.login.trim(),
        email: form.email.trim(),
        password: form.password
      };

    const action = isLoginMode ? loginUser(payload) : registerUser(payload);
    const result = await dispatch(action);

    if (loginUser.fulfilled.match(result)) {
      navigate(ROUTES.home, { replace: true });
    }

    if (registerUser.fulfilled.match(result)) {
      setRegistrationCompleted(true);
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    if (isLoginMode) {
      return;
    }

    validateField(name, value);
  };

  const getFieldError = (name) => {
    if (!(touched[name] || submitted)) {
      return '';
    }

    return validationErrors[name] || '';
  };

  const isSubmitDisabled = isLoading || !isFormValid;

  return (
    <div className="auth-page">
      <div className="auth-page__bg" role="presentation" aria-hidden="true" />

      <header className="auth-header">
        <Link className="auth-header__logo-link" to={ROUTES.register}>
          <img className="auth-header__logo" src={isDark ? logoDark : logoLight} alt="CodeBattles" />
        </Link>
        <div className="auth-header__toggle">
          <ThemeToggle />
        </div>
        <div className="auth-header__spacer" />
      </header>

      <div className="auth-content">
        <section className="auth-content__left" />

        <section className="auth-content__right">
          <div className="auth-form-wrap">
            <div className="auth-form-card">
              {registrationCompleted ? (
                <p className="auth-register-success">
                  Для завершения регистрации необходимо перейти по ссылке из письма, которое было отправлено на
                  указанный E-Mail.
                </p>
              ) : (
                <>
                  <div className="auth-mode-switch">
                    <span className={`auth-mode-switch__thumb ${isLoginMode ? 'auth-mode-switch__thumb--login' : ''}`} />
                    <button
                      className={`auth-mode-switch__option ${!isLoginMode ? 'auth-mode-switch__option--active' : ''}`}
                      type="button"
                      onClick={() => changeMode('register')}
                    >
                      Регистрация
                    </button>
                    <button
                      className={`auth-mode-switch__option ${isLoginMode ? 'auth-mode-switch__option--active' : ''}`}
                      type="button"
                      onClick={() => changeMode('login')}
                    >
                      Вход
                    </button>
                  </div>

                  <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-inputs">
                      {!isLoginMode && (
                        <div className="auth-input-group">
                          <input
                            className={`auth-input ${getFieldError('login') ? 'auth-input--error' : ''}`}
                            name="login"
                            type="text"
                            placeholder="Придумайте логин"
                            value={form.login}
                            onChange={handleChange}
                            maxLength={50}
                            onBlur={handleBlur}
                            autoComplete="username"
                          />
                          {getFieldError('login') && <p className="auth-input-error">{getFieldError('login')}</p>}
                        </div>
                      )}

                      <div className="auth-input-group">
                        <input
                          className={`auth-input ${getFieldError('email') ? 'auth-input--error' : ''}`}
                          name="email"
                          type="text"
                          inputMode="email"
                          placeholder="Введите Ваш email"
                          value={form.email}
                          onChange={handleChange}
                          maxLength={255}
                          onBlur={handleBlur}
                          autoComplete="email"
                        />
                        {getFieldError('email') && <p className="auth-input-error">{getFieldError('email')}</p>}
                      </div>

                      <div className="auth-input-group">
                        <input
                          className={`auth-input ${getFieldError('password') ? 'auth-input--error' : ''}`}
                          name="password"
                          type="password"
                          placeholder={isLoginMode ? 'Введите пароль' : 'Придумайте пароль'}
                          value={form.password}
                          onChange={handleChange}
                          maxLength={50}
                          onBlur={handleBlur}
                          autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                        />
                        {getFieldError('password') && <p className="auth-input-error">{getFieldError('password')}</p>}
                      </div>

                      {!isLoginMode && (
                        <div className="auth-input-group">
                          <input
                            className={`auth-input ${getFieldError('confirmPassword') ? 'auth-input--error' : ''}`}
                            name="confirmPassword"
                            type="password"
                            placeholder="Повторите пароль"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            maxLength={50}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                          />
                          {getFieldError('confirmPassword') && (
                            <p className="auth-input-error">{getFieldError('confirmPassword')}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="auth-social">
                      <button
                        className="auth-social__button auth-social__button--github"
                        type="button"
                        onClick={handleGitHubAuth}
                      >
                        <span>Продолжить с GitHub</span>
                        <img src={isDark ? GitHubIconDark : GitHubIconLight} alt="GitHub" />
                      </button>
                      <button className="auth-social__button auth-social__button--gitlab" type="button">
                        <span>Продолжить с GitLab</span>
                        <img src={GitLabIcon} alt="GitLab" />
                      </button>
                    </div>

                    {isLoginMode && (
                      <p className="auth-recovery-text">
                        Забыли пароль?{' '}
                        <Link className="auth-recovery-link" to={ROUTES.recovery}>Восстановить</Link>
                      </p>
                    )}

                    <button className="auth-submit" type="submit" disabled={isSubmitDisabled}>
                      {!isLoading && (isLoginMode ? 'Войти' : 'Зарегистрироваться')}
                      {isLoading && (isLoginMode ? 'Вход...' : 'Регистрация...')}
                    </button>
                  </form>
                </>
              )}
            </div>

            {error && (
              <div className="auth-server-error">
                {error}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;

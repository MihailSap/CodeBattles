import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../components/ThemeProvider';
import GitHubIconLight from '../../assets/GitHub-icon-light.svg';
import GitHubIconDark from '../../assets/GitHub-icon-dark.svg';
import GitLabIcon from '../../assets/GitLab-icon.svg';
import logo from '../../assets/logo.svg';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { clearAuthMessages, loginUser, registerUser } from '../../store/slices/authSlice';
import './AuthPage.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const isLoginMode = location.pathname === ROUTES.login;

  useEffect(() => {
    dispatch(clearAuthMessages());
    setForm(initialForm);
    setValidationErrors(initialErrors);
    setTouched({});
    setSubmitted(false);

    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch, location.pathname]);

  const changeMode = (mode) => {
    const nextRoute = mode === 'login' ? ROUTES.login : ROUTES.register;

    if (location.pathname !== nextRoute) {
      navigate(nextRoute);
    }
  };

  const validateLogin = (value) => {
    if (!value.trim()) {
      setValidationErrors((prev) => ({ ...prev, login: "Логин не может быть пустым" }));
    } else if (value.trim() && value.trim().length < 3 || value.trim().length > 50) {
      setValidationErrors((prev) => ({ ...prev, login: "Логин - от 3 до 50 символов" }));
    }
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      setValidationErrors((prev) => ({ ...prev, email: "Email не может быть пустым" }));
    } else if (value.trim() && !EMAIL_PATTERN.test(value.trim())) {
      setValidationErrors((prev) => ({ ...prev, email: "Некорректный email" }));
    }
  };

  const validatePassword = (value) => {
    if (value.length < 8) {
      setValidationErrors((prev) => ({ ...prev, password: "Минимальная длина пароля - 8 символов" }));
    }
  };

  const validateConfirmPassword = (value, password = form.password) => {
    if (value && value !== password) {
      setValidationErrors((prev) => ({ ...prev, confirmPassword: "Пароли не совпадают" }));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));

    switch (name) {
      case 'email':
        validateEmail(value);
        break;
      case 'login':
        validateLogin(value);
        break;
      case 'password':
        validatePassword(value);
        if (form.confirmPassword) {
          setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
          validateConfirmPassword(form.confirmPassword, value);
        }
        break;
      case 'confirmPassword':
        validateConfirmPassword(value);
        break;
      default:
        break;
    }
  };

  const isFormValid = Boolean(
    form.email &&
    (form.login || isLoginMode) &&
    form.password &&
    (form.confirmPassword || isLoginMode) &&
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

    if (loginUser.fulfilled.match(result) || registerUser.fulfilled.match(result)) {
      navigate(ROUTES.home, { replace: true });
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));
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
          <img className="auth-header__logo" src={logo} alt="CodeBattles" />
        </Link>
        <div className="auth-header__toggle">
          <ThemeToggle />
        </div>
        <div className="auth-header__spacer" />
      </header>

      <div className="auth-content">
        <section className="auth-content__left" />

        <section className="auth-content__right">
          <div className="auth-form-card">
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
              <div className='auth-form-inputs'>
                {!isLoginMode && (
                  <div className="auth-input-group">
                    <input
                      className={`auth-input ${getFieldError('login') ? 'auth-input--error' : ''}`}
                      name="login"
                      type="text"
                      placeholder="Придумайте логин"
                      value={form.login}
                      onChange={handleChange}
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
                    type="email"
                    placeholder="Введите Ваш email"
                    value={form.email}
                    onChange={handleChange}
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
                <button className="auth-social__button auth-social__button--github" type="button">
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
          </div>

          {error && <div className="auth-server-error">{error}</div>}
        </section>
      </div>
    </div>
  );
};

export default AuthPage;

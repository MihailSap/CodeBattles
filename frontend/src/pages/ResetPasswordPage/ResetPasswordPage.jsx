import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoLight from '../../assets/logo-light.svg';
import logoDark from '../../assets/logo-dark.svg';
import { useTheme } from '../../components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { clearAuthMessages, resetPasswordByToken } from '../../store/slices/authSlice';
import { validateConfirmPassword, validatePassword } from '../../utils/auth';
import '../AuthPage/AuthPage.css';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, error } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState('');

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);

    return params.get('token')?.trim() || '';
  }, [location.search]);

  useEffect(() => {
    dispatch(clearAuthMessages());

    if (!token) {
      navigate(ROUTES.login, { replace: true });
    }

    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch, navigate, token]);

  useEffect(() => {
    if (!resultMessage) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      navigate(ROUTES.login, { replace: true });
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigate, resultMessage]);

  const validateField = (name, value) => {
    if (name === 'password') {
      setPasswordError(validatePassword(value));
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
    }
    if (name === 'confirmPassword') {
      setConfirmPasswordError(validateConfirmPassword(value, password));
    }
    return '';
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'password') {
      setPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }

    validateField(name, value);
    dispatch(clearAuthMessages());
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    validateField(name, value);
  };

  const showPasswordError = touched.password || submitted ? passwordError : '';
  const showConfirmPasswordError = touched.confirmPassword || submitted ? confirmPasswordError : '';
  const isFormValid = Boolean(
    password &&
    confirmPassword &&
    !validatePassword(password) &&
    !validateConfirmPassword(confirmPassword, password)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (!isFormValid) {
      return;
    }

    const result = await dispatch(
      resetPasswordByToken({
        token,
        password
      })
    );

    if (resetPasswordByToken.fulfilled.match(result)) {
      setResultMessage('Пароль успешно изменён.');
      setResultType('success');
      return;
    }

    setResultMessage(result.payload || error || 'Не удалось изменить пароль');
    setResultType('error');
  };

  return (
    <div className="auth-page reset-password-page">
      <div className="auth-page__bg" role="presentation" aria-hidden="true" />

      <header className="auth-header">
        <Link className="auth-header__logo-link" to={ROUTES.login}>
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
            <div className="auth-form-card reset-password-card">
              {resultMessage ? (
                <p className={`reset-password-card__result ${resultType === 'success' ? 'reset-password-card__result--success' : 'reset-password-card__result--error'}`}>
                  {resultMessage}
                </p>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="reset-password-card__top">
                    <h1 className="reset-password-card__title">Восстановление пароля</h1>
                  </div>

                  <div className="auth-form-inputs reset-password-card__inputs">
                    <div className="auth-input-group">
                      <input
                        className={`auth-input ${showPasswordError ? 'auth-input--error' : ''}`}
                        name="password"
                        type="password"
                        placeholder="Придумайте пароль"
                        value={password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={50}
                        autoComplete="new-password"
                      />
                      {showPasswordError && <p className="auth-input-error">{showPasswordError}</p>}
                    </div>

                    <div className="auth-input-group">
                      <input
                        className={`auth-input ${showConfirmPasswordError ? 'auth-input--error' : ''}`}
                        name="confirmPassword"
                        type="password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={50}
                        autoComplete="new-password"
                      />
                      {showConfirmPasswordError && <p className="auth-input-error">{showConfirmPasswordError}</p>}
                    </div>
                  </div>

                  <button className="auth-submit" type="submit" disabled={isLoading || !isFormValid}>
                    {isLoading ? 'Отправка...' : 'Отправить'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

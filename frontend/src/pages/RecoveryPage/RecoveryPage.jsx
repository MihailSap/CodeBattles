import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import logoLight from '../../assets/logo-light.svg';
import logoDark from '../../assets/logo-dark.svg';
import { useTheme } from '../../components/ThemeProvider';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { clearAuthMessages, requestPasswordReset } from '../../store/slices/authSlice';
import { validateEmail } from '../../utils/auth';
import '../AuthPage/AuthPage.css';
import './RecoveryPage.css';

const RecoveryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    dispatch(clearAuthMessages());

    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isCompleted) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      navigate(ROUTES.login, { replace: true });
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isCompleted, navigate]);

  const handleChange = (event) => {
    const value = event.target.value.replace(/\s/g, '');

    setEmail(value);
    setEmailError(validateEmail(value));
    dispatch(clearAuthMessages());
  };

  const handleBlur = () => {
    setTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (validateEmail(email) !== '') {
      return;
    }

    const result = await dispatch(requestPasswordReset(email.trim()));

    if (requestPasswordReset.fulfilled.match(result)) {
      setIsCompleted(true);
    }
  };

  const shownEmailError = touched || submitted ? emailError : '';
  const isSubmitDisabled = isLoading || Boolean(validateEmail(email));

  return (
    <div className="auth-page recovery-page">
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
            <div className="auth-form-card recovery-card">
              {isCompleted ? (
                <p className="recovery-card__success">Ссылка для сброса пароля отправлена на указанный E-Mail.</p>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="recovery-card__top">
                    <Link className="recovery-card__back" to={ROUTES.login}>← Назад</Link>
                    <h1 className="recovery-card__title">Восстановление пароля</h1>
                    <p className="recovery-card__description">
                      Введите E-Mail, указанный при регистрации, на него будет отправлена ссылка для сброса пароля
                    </p>
                  </div>

                  <div className="auth-form-inputs recovery-card__inputs">
                    <div className="auth-input-group">
                      <input
                        className={`auth-input ${shownEmailError ? 'auth-input--error' : ''}`}
                        name="email"
                        type="text"
                        inputMode="email"
                        placeholder="Введите Ваш email"
                        value={email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="email"
                        maxLength={255}
                      />
                      {shownEmailError && <p className="auth-input-error">{shownEmailError}</p>}
                    </div>
                  </div>

                  <button className="auth-submit" type="submit" disabled={isSubmitDisabled}>
                    {isLoading ? 'Отправка...' : 'Отправить'}
                  </button>
                </form>
              )}
            </div>

            {error && !isCompleted && (
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

export default RecoveryPage;

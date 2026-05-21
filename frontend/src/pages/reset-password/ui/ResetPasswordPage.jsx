import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoLight from '@/shared/assets/logo-light.svg';
import logoDark from '@/shared/assets/logo-dark.svg';
import { useTheme } from '@/shared/lib/theme';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { clearAuthMessages, resetPasswordByToken } from '@/entities/session';
import { resetPasswordFormSchema } from '@/entities/session';
import '../../auth/ui/AuthPage.css';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, error } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

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

  const registerPasswordField = (name) =>
    register(name, {
      onChange: () => {
        dispatch(clearAuthMessages());
      },
    });

  const getPasswordError = (name) => {
    if (!(touchedFields[name] || isSubmitted)) {
      return '';
    }

    return errors[name]?.message || '';
  };

  const onSubmit = async ({ password }) => {
    const result = await dispatch(
      resetPasswordByToken({
        token,
        password,
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

  const showPasswordError = getPasswordError('password');
  const showConfirmPasswordError = getPasswordError('confirmPassword');

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
                <p
                  className={`reset-password-card__result ${resultType === 'success' ? 'reset-password-card__result--success' : 'reset-password-card__result--error'}`}
                >
                  {resultMessage}
                </p>
              ) : (
                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
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
                        maxLength={50}
                        autoComplete="new-password"
                        {...registerPasswordField('password')}
                      />
                      {showPasswordError && <p className="auth-input-error">{showPasswordError}</p>}
                    </div>

                    <div className="auth-input-group">
                      <input
                        className={`auth-input ${showConfirmPasswordError ? 'auth-input--error' : ''}`}
                        name="confirmPassword"
                        type="password"
                        placeholder="Повторите пароль"
                        maxLength={50}
                        autoComplete="new-password"
                        {...registerPasswordField('confirmPassword')}
                      />
                      {showConfirmPasswordError && <p className="auth-input-error">{showConfirmPasswordError}</p>}
                    </div>
                  </div>

                  <button className="auth-submit" type="submit" disabled={isLoading || !isValid}>
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

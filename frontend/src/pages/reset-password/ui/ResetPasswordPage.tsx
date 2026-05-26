import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch } from '@/app/providers/store';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoLight from '@/shared/assets/logo-light.svg';
import logoDark from '@/shared/assets/logo-dark.svg';
import { useTheme } from '@/shared/lib/theme';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { clearAuthMessages, resetPasswordByToken } from '@/entities/session';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@/entities/session';
import authPageStyles from '../../auth/ui/AuthPage.module.scss';
import resetPasswordPageStyles from './ResetPasswordPage.module.scss';

const ResetPasswordPage = () => {
  const dispatch = useAppDispatch();
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
  } = useForm<ResetPasswordFormValues>({
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
      navigate(ROUTES.login, {
        replace: true,
      });
    }

    return () => {
      dispatch(clearAuthMessages());
    };
  }, [dispatch, navigate, token]);

  useEffect(() => {
    if (!resultMessage || resultType !== 'success') {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      navigate(ROUTES.login, {
        replace: true,
      });
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigate, resultMessage, resultType]);

  const registerPasswordField = (name: keyof ResetPasswordFormValues) =>
    register(name, {
      onChange: () => {
        setResultMessage('');
        setResultType('');
        dispatch(clearAuthMessages());
      },
    });

  const getPasswordError = (name: keyof ResetPasswordFormValues): string => {
    if (!(touchedFields[name] || isSubmitted)) {
      return '';
    }

    return String(errors[name]?.message ?? '');
  };

  const onSubmit = async ({ password }: ResetPasswordFormValues) => {
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
    <div className={authPageStyles.root}>
      <div className={authPageStyles.bg} role="presentation" aria-hidden="true" />

      <header className={authPageStyles.authHeader}>
        <Link className={authPageStyles.logoLink} to={ROUTES.login}>
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
            <div className={[authPageStyles.card, resetPasswordPageStyles.root].join(' ')}>
              {resultType === 'success' ? (
                <p className={[resetPasswordPageStyles.result, resetPasswordPageStyles.isSuccess].join(' ')}>
                  {resultMessage}
                </p>
              ) : (
                <form className={authPageStyles.authForm} onSubmit={handleSubmit(onSubmit)}>
                  <div className={resetPasswordPageStyles.top}>
                    <h1 className={resetPasswordPageStyles.title}>Восстановление пароля</h1>
                  </div>

                  <div className={[authPageStyles.inputs, resetPasswordPageStyles.inputs].join(' ')}>
                    <div className={authPageStyles.group}>
                      <input
                        className={[authPageStyles.authInput, showPasswordError ? authPageStyles.isError : '']
                          .filter(Boolean)
                          .join(' ')}
                        type="password"
                        placeholder="Придумайте пароль"
                        maxLength={50}
                        autoComplete="new-password"
                        {...registerPasswordField('password')}
                      />
                      {showPasswordError && <p className={authPageStyles.isError}>{showPasswordError}</p>}
                    </div>

                    <div className={authPageStyles.group}>
                      <input
                        className={[authPageStyles.authInput, showConfirmPasswordError ? authPageStyles.isError : '']
                          .filter(Boolean)
                          .join(' ')}
                        type="password"
                        placeholder="Повторите пароль"
                        maxLength={50}
                        autoComplete="new-password"
                        {...registerPasswordField('confirmPassword')}
                      />
                      {showConfirmPasswordError && <p className={authPageStyles.isError}>{showConfirmPasswordError}</p>}
                    </div>
                  </div>

                  <button className={authPageStyles.submit} type="submit" disabled={isLoading || !isValid}>
                    {isLoading ? 'Отправка...' : 'Отправить'}
                  </button>

                  {resultType === 'error' && resultMessage && (
                    <p className={[resetPasswordPageStyles.result, resetPasswordPageStyles.isError].join(' ')}>
                      {resultMessage}
                    </p>
                  )}
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

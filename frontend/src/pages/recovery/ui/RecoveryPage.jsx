import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import logoLight from '@/shared/assets/logo-light.svg';
import logoDark from '@/shared/assets/logo-dark.svg';
import { useTheme } from '@/shared/lib/theme';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import { clearAuthMessages, requestPasswordReset } from '@/entities/session';
import { recoveryFormSchema } from '@/entities/session';
import authPageStyles from '../../auth/ui/AuthPage.module.scss';
import recoveryPageStyles from './RecoveryPage.module.scss';

const RecoveryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted, isValid, touchedFields },
  } = useForm({
    resolver: zodResolver(recoveryFormSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

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
      navigate(ROUTES.login, {
        replace: true,
      });
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isCompleted, navigate]);

  const emailField = register('email', {
    onChange: (event) => {
      event.target.value = event.target.value.replace(/\s/g, '');
      dispatch(clearAuthMessages());
    },
  });

  const onSubmit = async ({ email }) => {
    const result = await dispatch(requestPasswordReset(email.trim()));

    if (requestPasswordReset.fulfilled.match(result)) {
      setIsCompleted(true);
    }
  };

  const shownEmailError = touchedFields.email || isSubmitted ? errors.email?.message || '' : '';
  const isSubmitDisabled = isLoading || !isValid;

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
            <div className={authPageStyles.card}>
              {isCompleted ? (
                <p className={recoveryPageStyles.isSuccess}>Ссылка для сброса пароля отправлена на указанный E-Mail.</p>
              ) : (
                <form className={authPageStyles.authForm} onSubmit={handleSubmit(onSubmit)}>
                  <div className={recoveryPageStyles.top}>
                    <Link className={recoveryPageStyles.back} to={ROUTES.login}>
                      ← Назад
                    </Link>
                    <h1 className={recoveryPageStyles.title}>Восстановление пароля</h1>
                    <p className={recoveryPageStyles.description}>
                      Введите E-Mail, указанный при регистрации, на него будет отправлена ссылка для сброса пароля
                    </p>
                  </div>

                  <div className={[authPageStyles.inputs, recoveryPageStyles.inputs].join(' ')}>
                    <div className={authPageStyles.group}>
                      <input
                        className={[authPageStyles.authInput, shownEmailError ? authPageStyles.isError : '']
                          .filter(Boolean)
                          .join(' ')}
                        name="email"
                        type="text"
                        inputMode="email"
                        placeholder="Введите Ваш email"
                        autoComplete="email"
                        maxLength={255}
                        {...emailField}
                      />
                      {shownEmailError && <p className={authPageStyles.isError}>{shownEmailError}</p>}
                    </div>
                  </div>

                  <button className={authPageStyles.submit} type="submit" disabled={isSubmitDisabled}>
                    {isLoading ? 'Отправка...' : 'Отправить'}
                  </button>
                </form>
              )}
            </div>

            {error && !isCompleted && <div className={authPageStyles.serverError}>{error}</div>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecoveryPage;

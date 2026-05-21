import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import logoLight from '@/shared/assets/logo-light.svg';
import logoDark from '@/shared/assets/logo-dark.svg';
import { useTheme } from '@/shared/lib/theme';
import { ROUTES } from '@/shared/config/routes';
import { clearAuthMessages, verifyEmailUser } from '@/entities/session';
import authPageStyles from '../../auth/ui/AuthPage.module.scss';
import verifyEmailPageStyles from './VerifyEmailPage.module.scss';

const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [statusText, setStatusText] = useState('Идет подтверждение почты...');

  useEffect(() => {
    dispatch(clearAuthMessages());
    const params = new URLSearchParams(location.search);
    const token = params.get('token')?.trim();

    if (!token) {
      navigate(ROUTES.login, {
        replace: true,
      });

      return undefined;
    }

    let isActive = true;

    const verify = async () => {
      const result = await dispatch(verifyEmailUser(token));

      if (!isActive) {
        return;
      }

      const isSuccess = verifyEmailUser.fulfilled.match(result);
      setStatusText(isSuccess ? 'Почта успешно подтверждена!' : 'Не удалось подтвердить почту');

      setTimeout(() => {
        if (!isActive) {
          return;
        }

        navigate(isSuccess ? ROUTES.dashboard : ROUTES.login, {
          replace: true,
        });
      }, 2000);
    };

    verify();

    return () => {
      isActive = false;
      dispatch(clearAuthMessages());
    };
  }, [dispatch, location.search, navigate]);

  const isSuccess = statusText === 'Почта успешно подтверждена!';
  const isError = statusText === 'Не удалось подтвердить почту';

  return (
    <div className={authPageStyles.root}>
      <div className={authPageStyles.bg} role="presentation" aria-hidden="true" />

      <img className={verifyEmailPageStyles.logo} src={isDark ? logoDark : logoLight} alt="CodeBattles" />

      <main className={verifyEmailPageStyles.content}>
        <h1 className={verifyEmailPageStyles.title}>Подтверждение E-Mail</h1>
        <p
          className={[
            verifyEmailPageStyles.status,
            isSuccess ? verifyEmailPageStyles.isSuccess : '',
            isError ? verifyEmailPageStyles.isError : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {statusText}
        </p>
      </main>
    </div>
  );
};

export default VerifyEmailPage;

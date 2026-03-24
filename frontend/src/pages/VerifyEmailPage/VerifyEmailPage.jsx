import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import logoLight from '../../assets/logo-light.svg';
import logoDark from '../../assets/logo-dark.svg';
import { useTheme } from '../../components/ThemeProvider';
import { ROUTES } from '../../constants/routes';
import { clearAuthMessages, verifyEmailUser } from '../../store/slices/authSlice';
import '../AuthPage/AuthPage.css';
import './VerifyEmailPage.css';

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
      navigate(ROUTES.login, { replace: true });
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

        navigate(isSuccess ? ROUTES.home : ROUTES.login, { replace: true });
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
    <div className="auth-page verify-email-page">
      <div className="auth-page__bg" role="presentation" aria-hidden="true" />

      <img className="verify-email-page__logo" src={isDark ? logoDark : logoLight} alt="CodeBattles" />


      <main className="verify-email-page__content">
        <h1 className="verify-email-page__title">Подтверждение E-Mail</h1>
        <p
          className={`verify-email-page__status ${isSuccess ? 'verify-email-page__status--success' : ''} ${isError ? 'verify-email-page__status--error' : ''}`}
        >
          {statusText}
        </p>
      </main>
    </div>
  );
};

export default VerifyEmailPage;

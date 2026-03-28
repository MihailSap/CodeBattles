import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner/Spinner';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../store/slices/authSlice';
import './MainPage.css';

const MainPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className="main-page">
      <div className="main-page__card">
        <h1 className="main-page__title">Главная страница</h1>
        <p className="main-page__text">Email: {user?.email || '—'}</p>
        <p className="main-page__text">Логин: {user?.login || '—'}</p>
        {isAdmin && (
          <Link className="main-page__admin-link" to={ROUTES.admin}>
            Перейти в админ-панель
          </Link>
        )}

        <button className="main-page__button" type="button" onClick={handleLogout} disabled={isLoading}>
          Выйти
        </button>
      </div>

      {isLoading && (
        <div className="main-page__loader">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default MainPage;

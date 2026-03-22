import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="not-found-page">
      <div className="not-found-page__bg" role="presentation" aria-hidden="true" />
      <div className="not-found-page__card">
        <p className="not-found-page__code">404</p>
        <h1 className="not-found-page__title">Страница не найдена</h1>
        <p className="not-found-page__text">Похоже, ссылка устарела или была введена с ошибкой.</p>

        <div className="not-found-page__actions">
          {isAuthenticated ? (
            <Link className="not-found-page__link" to={ROUTES.home}>
              На главную
            </Link>
          ) : (
            <Link className="not-found-page__link" to={ROUTES.login}>
              К входу
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

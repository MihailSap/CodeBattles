import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import notFoundPageStyles from './NotFoundPage.module.scss';

const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className={notFoundPageStyles.root}>
      <div className={notFoundPageStyles.bg} role="presentation" aria-hidden="true" />
      <div className={notFoundPageStyles.card}>
        <p className={notFoundPageStyles.code}>404</p>
        <h1 className={notFoundPageStyles.title}>Страница не найдена</h1>
        <p className={notFoundPageStyles.text}>Похоже, ссылка устарела или была введена с ошибкой.</p>

        <div className={notFoundPageStyles.actions}>
          {isAuthenticated ? (
            <Link className={notFoundPageStyles.link} to={ROUTES.dashboard}>
              На главную
            </Link>
          ) : (
            <Link className={notFoundPageStyles.link} to={ROUTES.home}>
              К входу
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

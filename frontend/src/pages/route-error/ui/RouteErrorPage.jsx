import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import routeErrorPageStyles from './RouteErrorPage.module.scss';

const RouteErrorPage = () => {
  const error = useRouteError();
  const { isAuthenticated } = useAuth();
  let title = 'Что-то пошло не так';
  let description = 'Не удалось открыть страницу.';

  if (isRouteErrorResponse(error)) {
    title = `Ошибка ${error.status}`;
    description = error.statusText || description;
  }

  return (
    <div className={routeErrorPageStyles.root}>
      <div className={routeErrorPageStyles.bg} role="presentation" aria-hidden="true" />
      <div className={routeErrorPageStyles.card}>
        <h1 className={routeErrorPageStyles.title}>{title}</h1>
        <p className={routeErrorPageStyles.text}>{description}</p>
        {isAuthenticated ? (
          <Link className={routeErrorPageStyles.link} to={ROUTES.dashboard}>
            На главную
          </Link>
        ) : (
          <Link className={routeErrorPageStyles.link} to={ROUTES.home}>
            К входу
          </Link>
        )}
      </div>
    </div>
  );
};

export default RouteErrorPage;

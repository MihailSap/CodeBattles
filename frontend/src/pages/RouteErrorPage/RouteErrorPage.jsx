import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import './RouteErrorPage.css';

const RouteErrorPage = () => {
  const error = useRouteError();

  let title = 'Что-то пошло не так';
  let description = 'Не удалось открыть страницу.';

  if (isRouteErrorResponse(error)) {
    title = `Ошибка ${error.status}`;
    description = error.statusText || description;
  }

  return (
    <div className="route-error-page">
      <div className="route-error-page__bg" role="presentation" aria-hidden="true" />
      <div className="route-error-page__card">
        <h1 className="route-error-page__title">{title}</h1>
        <p className="route-error-page__text">{description}</p>
        <Link className="route-error-page__link" to={ROUTES.home}>Вернуться на главную</Link>
      </div>
    </div>
  );
};

export default RouteErrorPage;

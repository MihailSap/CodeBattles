import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '@/shared/ui/spinner';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import protectedRouteStyles from './ProtectedRoute.module.scss';

interface ProtectedRouteProps {
  onlyUnauthorized?: boolean;
  onlyAdmin?: boolean;
}

const ProtectedRoute = ({ onlyUnauthorized = false, onlyAdmin = false }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isInitialized, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (!isInitialized) {
    return (
      <div className={protectedRouteStyles.routeLoaderWrapper}>
        <Spinner />
      </div>
    );
  }

  if (onlyUnauthorized && isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  if (!onlyUnauthorized && !isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  if (onlyAdmin && !isAdmin) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

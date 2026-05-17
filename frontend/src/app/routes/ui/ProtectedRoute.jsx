import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '@/shared/ui/spinner';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import './ProtectedRoute.css';

const ProtectedRoute = ({ onlyUnauthorized = false, onlyAdmin = false }) => {
  const location = useLocation();
  const { isInitialized, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (!isInitialized) {
    return (
      <div className="route-loader-wrapper">
        <Spinner />
      </div>
    );
  }

  if (onlyUnauthorized && isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (!onlyUnauthorized && !isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (onlyAdmin && !isAdmin) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

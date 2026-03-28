import { Navigate, Outlet } from 'react-router-dom';
import Spinner from '../Spinner/Spinner';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './ProtectedRoute.css';

const ProtectedRoute = ({ onlyUnauthorized = false, onlyAdmin = false }) => {
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
    return <Navigate to={ROUTES.login} replace />;
  }

  if (onlyAdmin && !isAdmin) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

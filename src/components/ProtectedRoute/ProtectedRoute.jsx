import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './ProtectedRoute.css';

const ProtectedRoute = ({ onlyUnauthorized = false }) => {
  const { isInitialized, isAuthenticated } = useAuth();

  if (!isInitialized) {
    return (
      <div className="route-loader-wrapper">
        <p className="route-loader-text">Загрузка...</p>
      </div>
    );
  }

  if (onlyUnauthorized && isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (!onlyUnauthorized && !isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

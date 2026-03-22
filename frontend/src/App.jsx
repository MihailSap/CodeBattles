import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ROUTES } from './constants/routes';
import AuthPage from './pages/AuthPage/AuthPage';
import MainPage from './pages/MainPage/MainPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import RecoveryPage from './pages/RecoveryPage/RecoveryPage';
import { initializeAuth } from './store/slices/authSlice';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.home} element={<MainPage />} />
        </Route>

        <Route element={<ProtectedRoute onlyUnauthorized />}>
          <Route path={ROUTES.login} element={<AuthPage />} />
          <Route path={ROUTES.register} element={<AuthPage />} />
          <Route path={ROUTES.recovery} element={<RecoveryPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

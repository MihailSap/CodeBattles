import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { ROUTES } from './constants/routes';
import AuthPage from './pages/AuthPage/AuthPage';
import AdminPage from './pages/AdminPage/AdminPage';
import MainPage from './pages/MainPage/MainPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import RecoveryPage from './pages/RecoveryPage/RecoveryPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage/VerifyEmailPage';
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
          <Route path={ROUTES.profile} element={<ProfilePage />} />
          <Route path={ROUTES.profileByUserId} element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute onlyAdmin />}>
          <Route path={ROUTES.admin} element={<AdminPage />} />
        </Route>

        <Route element={<ProtectedRoute onlyUnauthorized />}>
          <Route path={ROUTES.login} element={<AuthPage />} />
          <Route path={ROUTES.register} element={<AuthPage />} />
          <Route path={ROUTES.recovery} element={<RecoveryPage />} />
        </Route>

        <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

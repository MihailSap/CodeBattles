import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Spinner from './components/Spinner/Spinner';
import { ROUTES } from './constants/routes';
import RouteErrorPage from './pages/RouteErrorPage/RouteErrorPage';
import { initializeAuth } from './store/slices/authSlice';
import { store } from './store/store';

const AuthPage = lazy(() => import('./pages/AuthPage/AuthPage'));
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage'));
const MainPage = lazy(() => import('./pages/MainPage/MainPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage/LeaderboardPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage/NotFoundPage'));
const OrganizationInviteJoinPage = lazy(() => import('./pages/OrganizationInviteJoinPage/OrganizationInviteJoinPage'));
const OrganizationPage = lazy(() => import('./pages/OrganizationPage/OrganizationPage'));
const ProjectInviteJoinPage = lazy(() => import('./pages/ProjectInviteJoinPage/ProjectInviteJoinPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage/ProjectPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage/ProjectsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage/ProfilePage'));
const RecoveryPage = lazy(() => import('./pages/RecoveryPage/RecoveryPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage/ResetPasswordPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage/ReviewsPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage/ReviewPage'));
const TaskCreatePage = lazy(() => import('./pages/TaskCreatePage/TaskCreatePage'));
const TaskPage = lazy(() => import('./pages/TaskPage/TaskPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage/VerifyEmailPage'));

const withSuspense = (element) => (
  <Suspense fallback={<div className="page-loader"><Spinner /></div>}>
    {element}
  </Suspense>
);

const authLoader = async () => {
  const state = store.getState();
  if (state.auth?.isInitialized) {
    return null;
  }
  await store.dispatch(initializeAuth());
  return null;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route loader={authLoader} errorElement={<RouteErrorPage />}>
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.home} element={withSuspense(<MainPage />)} />
        <Route path={ROUTES.projects} element={withSuspense(<ProjectsPage />)} />
        <Route path={ROUTES.projectById} element={withSuspense(<ProjectPage />)} />
        <Route path={ROUTES.organizationById} element={withSuspense(<OrganizationPage />)} />
        <Route path={ROUTES.projectTaskCreate} element={withSuspense(<TaskCreatePage />)} />
        <Route path={ROUTES.projectTaskById} element={withSuspense(<TaskPage />)} />
        <Route path={ROUTES.reviewById} element={withSuspense(<ReviewPage />)} />
        <Route path={ROUTES.reviews} element={withSuspense(<ReviewsPage />)} />
        <Route path={ROUTES.leaderboard} element={withSuspense(<LeaderboardPage />)} />
        <Route path={ROUTES.profile} element={withSuspense(<ProfilePage />)} />
        <Route path={ROUTES.profileByUserId} element={withSuspense(<ProfilePage />)} />
      </Route>

      <Route element={<ProtectedRoute onlyAdmin />}>
        <Route path={ROUTES.admin} element={withSuspense(<AdminPage />)} />
      </Route>

      <Route element={<ProtectedRoute onlyUnauthorized />}>
        <Route path={ROUTES.login} element={withSuspense(<AuthPage />)} />
        <Route path={ROUTES.register} element={withSuspense(<AuthPage />)} />
        <Route path={ROUTES.recovery} element={withSuspense(<RecoveryPage />)} />
      </Route>

      <Route path={ROUTES.verifyEmail} element={withSuspense(<VerifyEmailPage />)} />
      <Route path={ROUTES.resetPassword} element={withSuspense(<ResetPasswordPage />)} />
      <Route path={ROUTES.projectJoinByToken} element={withSuspense(<ProjectInviteJoinPage />)} />
      <Route path={ROUTES.organizationJoinByToken} element={withSuspense(<OrganizationInviteJoinPage />)} />

      <Route path="*" element={withSuspense(<NotFoundPage />)} />
    </Route>
  )
);

const App = () => <RouterProvider router={router} />;

export default App;

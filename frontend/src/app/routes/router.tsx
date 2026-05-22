import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { initializeAuth } from '@/entities/session';
import { ROUTES } from '@/shared/config/routes';
import { AuthorizedLayout } from '@/app/layouts';
import Spinner from '@/shared/ui/spinner';
import AdminPage from '@/pages/admin';
import RouteErrorPage from '@/pages/route-error';
import ProtectedRoute from './ui/ProtectedRoute';
import { store } from '../providers/store';

import type { ReactNode } from 'react';

const AuthPage = lazy(() => import('@/pages/auth'));
const LandingPage = lazy(() => import('@/pages/landing'));
const MainPage = lazy(() => import('@/pages/main'));
const LeaderboardPage = lazy(() => import('@/pages/leaderboard'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));
const OrganizationInviteJoinPage = lazy(() => import('@/pages/organization-invite-join'));
const OrganizationPage = lazy(() => import('@/pages/organization'));
const ProjectInviteJoinPage = lazy(() => import('@/pages/project-invite-join'));
const ProjectPage = lazy(() => import('@/pages/project'));
const ProjectsPage = lazy(() => import('@/pages/projects'));
const ProfilePage = lazy(() => import('@/pages/profile'));
const RecoveryPage = lazy(() => import('@/pages/recovery'));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password'));
const ReviewsPage = lazy(() => import('@/pages/reviews'));
const ReviewPage = lazy(() => import('@/pages/review'));
const TaskCreatePage = lazy(() => import('@/pages/task-create'));
const TaskPage = lazy(() => import('@/pages/task'));
const VerifyEmailPage = lazy(() => import('@/pages/verify-email'));

const RootFallback = () => (
  <div className="page-loader">
    <Spinner />
  </div>
);

const withSuspense = (element: ReactNode) => (
  <Suspense
    fallback={
      <div className="page-loader">
        <Spinner />
      </div>
    }
  >
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    loader: authLoader,
    errorElement: <RouteErrorPage />,
    HydrateFallback: RootFallback,
    children: [
      {
        index: true,
        element: withSuspense(<LandingPage />),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AuthorizedLayout />,
            children: [
              {
                path: ROUTES.dashboard,
                element: withSuspense(<MainPage />),
              },
              {
                path: ROUTES.projects,
                element: withSuspense(<ProjectsPage />),
              },
              {
                path: ROUTES.projectById,
                element: withSuspense(<ProjectPage />),
              },
              {
                path: ROUTES.organizationById,
                element: withSuspense(<OrganizationPage />),
              },
              {
                path: ROUTES.projectTaskCreate,
                element: withSuspense(<TaskCreatePage />),
              },
              {
                path: ROUTES.projectTaskById,
                element: withSuspense(<TaskPage />),
              },
              {
                path: ROUTES.reviewById,
                element: withSuspense(<ReviewPage />),
              },
              {
                path: ROUTES.reviews,
                element: withSuspense(<ReviewsPage />),
              },
              {
                path: ROUTES.leaderboard,
                element: withSuspense(<LeaderboardPage />),
              },
              {
                path: ROUTES.profile,
                element: withSuspense(<ProfilePage />),
              },
              {
                path: ROUTES.profileByUserId,
                element: withSuspense(<ProfilePage />),
              },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute onlyAdmin />,
        children: [
          {
            path: ROUTES.admin,
            element: withSuspense(<AdminPage />),
          },
        ],
      },
      {
        element: <ProtectedRoute onlyUnauthorized />,
        children: [
          {
            path: ROUTES.login,
            element: withSuspense(<AuthPage />),
          },
          {
            path: ROUTES.register,
            element: withSuspense(<AuthPage />),
          },
          {
            path: ROUTES.recovery,
            element: withSuspense(<RecoveryPage />),
          },
        ],
      },
      {
        path: ROUTES.verifyEmail,
        element: withSuspense(<VerifyEmailPage />),
      },
      {
        path: ROUTES.resetPassword,
        element: withSuspense(<ResetPasswordPage />),
      },
      {
        path: ROUTES.projectJoinByToken,
        element: withSuspense(<ProjectInviteJoinPage />),
      },
      {
        path: ROUTES.organizationJoinByToken,
        element: withSuspense(<OrganizationInviteJoinPage />),
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;

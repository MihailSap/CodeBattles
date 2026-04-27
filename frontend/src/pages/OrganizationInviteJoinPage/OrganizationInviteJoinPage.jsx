import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import Spinner from '../../components/Spinner/Spinner';
import { ACCESS_ERROR_CODE } from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './OrganizationInviteJoinPage.css';

const OrganizationInviteJoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated, userId } = useAuth();

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !token) {
      return;
    }

    let isMounted = true;

    const join = async () => {
      try {
        const result = await projectsApi.joinOrganizationByInvite(token, Number(userId));

        if (!isMounted) {
          return;
        }

        navigate(ROUTES.organizationById.replace(':organizationId', result.organizationId), {
          replace: true,
          state: {
            snackbarMessage: 'Вы присоединились к организации',
            snackbarType: 'success'
          }
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.code === ACCESS_ERROR_CODE.ALREADY_MEMBER) {
          const inviteInfo = await projectsApi.getOrganizationInviteInfo(token).catch(() => null);

          if (inviteInfo?.organizationId) {
            navigate(ROUTES.organizationById.replace(':organizationId', inviteInfo.organizationId), {
              replace: true,
              state: {
                snackbarMessage: 'Вы уже являетесь участником этой организации',
                snackbarType: 'success'
              }
            });
            return;
          }
        }

        navigate(ROUTES.projects, {
          replace: true,
          state: {
            snackbarMessage: 'Пригласительная ссылка недействительна или устарела',
            snackbarType: 'error'
          }
        });
      }
    };

    join();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isInitialized, navigate, token, userId]);

  if (!isInitialized) {
    return (
      <div className="project-invite-page">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: ROUTES.organizationJoinByToken.replace(':token', token) }} />;
  }

  return (
    <div className="project-invite-page">
      <Spinner />
    </div>
  );
};

export default OrganizationInviteJoinPage;

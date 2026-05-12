import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { projectsApi } from '../../api/projectsApi';
import Spinner from '../../components/Spinner/Spinner';
import { ACCESS_ERROR_CODE } from '../../constants/project';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import './ProjectInviteJoinPage.css';

const ProjectInviteJoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { isInitialized, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !token) {
      return;
    }

    let isMounted = true;

    const join = async () => {
      try {
        const result = await projectsApi.joinByInvite(token);

        if (!isMounted) {
          return;
        }

        navigate(`${ROUTES.projects}/${result.projectId}`, {
          replace: true,
          state: {
            snackbarMessage: 'Вы присоединились к проекту',
            snackbarType: 'success'
          }
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error?.code === ACCESS_ERROR_CODE.ALREADY_MEMBER) {
          const inviteInfo = await projectsApi.getInviteInfo(token).catch(() => null);

          if (inviteInfo?.projectId) {
            navigate(`${ROUTES.projects}/${inviteInfo.projectId}`, {
              replace: true,
              state: {
                snackbarMessage: 'Вы уже являетесь участником этого проекта',
                snackbarType: 'success'
              }
            });
            return;
          }
        }

        if (error?.code === ACCESS_ERROR_CODE.FORBIDDEN_ORGANIZATION) {
          navigate(ROUTES.projects, {
            replace: true,
            state: {
              snackbarMessage: 'Необходимо присоединиться к организации',
              snackbarType: 'error'
            }
          });
          return;
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
  }, [isAuthenticated, isInitialized, navigate, token]);

  if (!isInitialized) {
    return (
      <div className="project-invite-page">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: `${ROUTES.projects}/join/${token}` }} />;
  }

  return (
    <div className="project-invite-page">
      <Spinner />
    </div>
  );
};

export default ProjectInviteJoinPage;

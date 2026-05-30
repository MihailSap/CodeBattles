import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { organizationApi } from '@/entities/organization';
import Spinner from '@/shared/ui/spinner';
import { ACCESS_ERROR_CODE } from '@/entities/project';
import { ROUTES } from '@/shared/config/routes';
import { useAuth } from '@/entities/session';
import projectInviteJoinPageStyles from '../../project-invite-join/ui/ProjectInviteJoinPage.module.scss';

const OrganizationInviteJoinPage = () => {
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
        const result = await organizationApi.joinOrganizationByInvite(token);

        if (!isMounted) {
          return;
        }

        if (result.organizationId === undefined) {
          throw new Error('Organization id is missing after invite join');
        }

        navigate(ROUTES.organizationById.replace(':organizationId', String(result.organizationId)), {
          replace: true,
          state: {
            snackbarMessage: 'Вы присоединились к организации',
            snackbarType: 'success',
          },
        });
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        if (error instanceof Error && error.code === ACCESS_ERROR_CODE.ALREADY_MEMBER) {
          const inviteInfo = await organizationApi.getOrganizationInviteInfo(token).catch(() => null);

          if (inviteInfo?.id) {
            navigate(ROUTES.organizationById.replace(':organizationId', String(inviteInfo.id)), {
              replace: true,
              state: {
                snackbarMessage: 'Вы уже являетесь участником этой организации',
                snackbarType: 'success',
              },
            });

            return;
          }
        }

        navigate(ROUTES.projects, {
          replace: true,
          state: {
            snackbarMessage: 'Пригласительная ссылка недействительна или устарела',
            snackbarType: 'error',
          },
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
      <div className={projectInviteJoinPageStyles.projectInvitePage}>
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{
          from: ROUTES.organizationJoinByToken.replace(':token', token || ''),
        }}
      />
    );
  }

  return (
    <div className={projectInviteJoinPageStyles.projectInvitePage}>
      <Spinner />
    </div>
  );
};

export default OrganizationInviteJoinPage;

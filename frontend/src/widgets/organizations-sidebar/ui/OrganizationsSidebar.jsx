import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CollapseIcon } from '@/shared/ui/icons';
import { ORGANIZATION_MEMBER_ROLE, ORGANIZATION_MEMBER_ROLE_LABELS } from '@/entities/organization';
import { ROUTES } from '@/shared/config/routes';
import { useBodyScrollLock } from '@/shared/lib/hooks';
import { useGetMyOrganizationsQuery } from '@/entities/project';
import Spinner from '@/shared/ui/spinner';
import organizationsSidebarStyles from './OrganizationsSidebar.module.scss';
import mainPageStyles from '../../../pages/main/ui/MainPage.module.scss';

const OrganizationsSidebar = ({ isOpen, onClose, viewerId }) => {
  const { data: items = [], isLoading } = useGetMyOrganizationsQuery(viewerId, {
    skip: !isOpen || !viewerId,
    refetchOnMountOrArgChange: 60,
  });

  const headerHeight = document.querySelector(`.${mainPageStyles.header}`)?.getBoundingClientRect().height || 0;
  useBodyScrollLock(isOpen);

  const sorted = useMemo(
    () =>
      [...items].sort((left, right) => {
        const leftPriority = left.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 0 : 1;
        const rightPriority = right.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 0 : 1;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return left.name.localeCompare(right.name, 'ru', {
          sensitivity: 'base',
        });
      }),
    [items]
  );

  return (
    <div
      className={[
        organizationsSidebarStyles.overlay,
        isOpen ? organizationsSidebarStyles.isOpen : organizationsSidebarStyles.isClosed,
      ]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      onClick={isOpen ? onClose : undefined}
    >
      <aside
        className={[
          organizationsSidebarStyles.root,
          isOpen
            ? organizationsSidebarStyles.organizationsSidebarOpen
            : organizationsSidebarStyles.organizationsSidebarClosed,
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Мои организации"
        onClick={(event) => event.stopPropagation()}
        style={{
          top: `${headerHeight + 30}px`,
          height: `calc(100vh - ${headerHeight + 60}px)`,
        }}
      >
        <div className={organizationsSidebarStyles.head}>
          <h2 className={organizationsSidebarStyles.title}>Мои организации</h2>
          <button
            className={organizationsSidebarStyles.close}
            type="button"
            onClick={onClose}
            aria-label="Свернуть список"
          >
            <CollapseIcon />
          </button>
        </div>

        <ul className={organizationsSidebarStyles.list}>
          {isLoading ? (
            <li className={organizationsSidebarStyles.isLoading}>
              <Spinner />
            </li>
          ) : sorted.length === 0 ? (
            <li className={organizationsSidebarStyles.isEmpty}>Вы еще не создали ни одну организацию</li>
          ) : (
            sorted.map((organization, index) => (
              <li
                key={organization.id}
                className={[
                  organizationsSidebarStyles.item,
                  index === sorted.length - 1 ? organizationsSidebarStyles.isLast : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Link
                  className={organizationsSidebarStyles.itemLink}
                  to={ROUTES.organizationById.replace(':organizationId', organization.id)}
                  onClick={onClose}
                >
                  <img
                    className={organizationsSidebarStyles.logo}
                    src={organization.logo}
                    alt={`Логотип ${organization.name}`}
                  />
                  <div className={organizationsSidebarStyles.meta}>
                    <p className={organizationsSidebarStyles.name}>{organization.name}</p>
                    <p
                      className={[
                        organizationsSidebarStyles.role,
                        organization.role === ORGANIZATION_MEMBER_ROLE.OWNER
                          ? organizationsSidebarStyles.isOwner
                          : organizationsSidebarStyles.isMember,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {ORGANIZATION_MEMBER_ROLE_LABELS[organization.role]}
                    </p>
                    <p className={organizationsSidebarStyles.projects}>Проектов: {organization.projectsCount}</p>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
};

export default OrganizationsSidebar;

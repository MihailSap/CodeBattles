import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CollapseIcon } from '../Icons/Icons';
import { ORGANIZATION_MEMBER_ROLE, ORGANIZATION_MEMBER_ROLE_LABELS } from '../../constants/organization';
import { ROUTES } from '../../constants/routes';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { projectsApi } from '../../api/projectsApi';
import Spinner from '../Spinner/Spinner';
import './OrganizationsSidebar.css';

const OrganizationsSidebar = ({ isOpen, onClose, viewerId }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const headerHeight = document.querySelector('.header')?.getBoundingClientRect().height || 0;

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        const result = await projectsApi.getMyOrganizations(viewerId, { page: 1, pageSize: 15 });

        if (!isMounted) {
          return;
        }

        setItems(result.data);
        setPage(1);
        setHasMore(result.hasMore);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [isOpen, viewerId]);

  const handleScroll = async (event) => {
    if (!hasMore) {
      return;
    }

    const target = event.currentTarget;
    const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 20;

    if (!isBottom) {
      return;
    }

    const nextPage = page + 1;
    const result = await projectsApi.getMyOrganizations(viewerId, { page: nextPage, pageSize: 15 });
    setItems((prev) => [...prev, ...result.data]);
    setPage(nextPage);
    setHasMore(result.hasMore);
  };

  const sorted = useMemo(
    () =>
      [...items].sort((left, right) => {
        const leftPriority = left.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 0 : 1;
        const rightPriority = right.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 0 : 1;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return left.name.localeCompare(right.name, 'ru', { sensitivity: 'base' });
      }),
    [items]
  );

  return (
    <div
      className={`organizations-sidebar__overlay ${isOpen ? 'organizations-sidebar__overlay--open' : 'organizations-sidebar__overlay--closed'}`}
      role="presentation"
      onClick={isOpen ? onClose : undefined}
    >
      <aside
        className={`organizations-sidebar ${isOpen ? 'organizations-sidebar--open' : 'organizations-sidebar--closed'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Мои организации"
        onClick={(event) => event.stopPropagation()}
        style={{ top: `${headerHeight + 30}px`, height: `calc(100vh - ${headerHeight + 60}px)` }}
      >
        <div className="organizations-sidebar__head">
          <h2 className="organizations-sidebar__title">Мои организации</h2>
          <button className="organizations-sidebar__close" type="button" onClick={onClose} aria-label="Свернуть список">
            <CollapseIcon />
          </button>
        </div>

        <ul className="organizations-sidebar__list" onScroll={handleScroll}>
          {isLoading ? (
            <li className="organizations-sidebar__loading">
              <Spinner />
            </li>
          ) : sorted.length === 0 ? (
            <li className="organizations-sidebar__empty">Вы еще не создали ни одну организацию</li>
          ) : (
            sorted.map((organization, index) => (
              <li key={organization.id} className={`organizations-sidebar__item ${index === sorted.length - 1 ? 'organizations-sidebar__item--last' : ''}`}>
                <Link
                  className="organizations-sidebar__item-link"
                  to={ROUTES.organizationById.replace(':organizationId', organization.id)}
                  onClick={onClose}
                >
                  <img className="organizations-sidebar__logo" src={organization.logo} alt={`Логотип ${organization.name}`} />
                  <div className="organizations-sidebar__meta">
                    <p className="organizations-sidebar__name">{organization.name}</p>
                    <p
                      className={`organizations-sidebar__role ${organization.role === ORGANIZATION_MEMBER_ROLE.OWNER ? 'organizations-sidebar__role--owner' : 'organizations-sidebar__role--member'}`}
                    >
                      {ORGANIZATION_MEMBER_ROLE_LABELS[organization.role]}
                    </p>
                    <p className="organizations-sidebar__projects">Проектов: {organization.projectsCount}</p>
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
